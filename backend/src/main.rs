use std::{env, net::SocketAddr, path::{PathBuf}};

use argon2::{
    password_hash::{rand_core::OsRng, SaltString}, Algorithm, Argon2, Params, PasswordHash,
    PasswordHasher, PasswordVerifier, Version,
};
use axum::{
    extract::{Json, Path as AxumPath, State},
    http::{HeaderMap, HeaderValue, Method, StatusCode},
    response::Json as JsonResponse,
    routing::{delete, get, post},
    Router,
};
use chrono::{DateTime, Utc};
use jsonwebtoken::{
    decode, encode, Algorithm as JwtAlgorithm, DecodingKey, EncodingKey, Header, Validation,
};
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, Row};
use tower_http::cors::{Any, CorsLayer};
use tracing::info;
use uuid::Uuid;

#[derive(Clone)]
struct AppState {
    db: PgPool,
    jwt_secret: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct HealthResponse {
    status: String,
    service: String,
    version: String,
    timestamp: DateTime<Utc>,
    database: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct UserSummary {
    id: String,
    email: String,
    role: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct LoginRequest {
    email: String,
    password: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct RegisterRequest {
    email: String,
    password: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct AuthResponse {
    token: String,
    user: UserSummary,
}

#[derive(Debug, Serialize, Deserialize)]
struct TokenClaims {
    sub: String,
    email: String,
    role: String,
    exp: usize,
}

#[derive(Debug, Serialize, Deserialize)]
struct VaultItem {
    id: String,
    title: String,
    kind: String,
    favorite: bool,
    encrypted_payload: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize)]
struct VaultResponse {
    data: Vec<VaultItem>,
    count: usize,
}

#[derive(Debug, Serialize, Deserialize)]
struct CreateVaultRequest {
    #[serde(default)]
    title: String,
    #[serde(default)]
    kind: String,
    #[serde(default)]
    favorite: bool,
    #[serde(default)]
    encrypted_payload: Option<serde_json::Value>,
    #[serde(default)]
    site: String,
    #[serde(default)]
    login: String,
    #[serde(default)]
    password: String,
    #[serde(default)]
    notes: String,
    #[serde(default)]
    url: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct ShareRequest {
    vault_item_id: String,
    recipient_email: String,
    share_type: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct AdminStats {
    users: i64,
    vault_items: i64,
    shares: i64,
}

#[derive(Debug, Clone)]
struct AuthenticatedUser {
    user_id: String,
    email: String,
    role: String,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .with_target(false)
        .compact()
        .init();

    let database_url = env::var("DATABASE_URL").unwrap_or_else(|_| {
        "postgresql://nexvault:nexvault_secure_password@localhost:5432/nexvault".to_string()
    });
    let jwt_secret = env::var("JWT_SECRET").unwrap_or_else(|_| "dev-secret-change-me".to_string());

    let db = sqlx::PgPool::connect(&database_url)
        .await
        .expect("database connection failed");

    let migration_dir = env::var("MIGRATIONS_DIR")
        .map(PathBuf::from)
        .unwrap_or_else(|_| {
            let candidates = [
                PathBuf::from("backend/migrations"),
                PathBuf::from("migrations"),
                PathBuf::from("/app/migrations"),
            ];

            candidates
                .into_iter()
                .find(|path| path.exists())
                .unwrap_or_else(|| PathBuf::from("migrations"))
        });

    let migrator = sqlx::migrate::Migrator::new(migration_dir)
        .await
        .expect("migration directory not found");
    migrator.run(&db).await.expect("database migrations failed");

    let app_state = AppState {
        db: db.clone(),
        jwt_secret: jwt_secret.clone(),
    };

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PUT,
            Method::DELETE,
            Method::OPTIONS,
        ])
        .allow_headers([
            axum::http::header::CONTENT_TYPE,
            axum::http::header::AUTHORIZATION,
        ]);

    let app = Router::new()
        .route("/api/v1/health", get(health_check))
        .route("/api/v1/auth/register", post(register_handler))
        .route("/api/v1/auth/login", post(login_handler))
        .route("/api/v1/vault/items", get(list_vault_items).post(create_vault_item))
        .route("/api/v1/vault/items/{id}", delete(delete_vault_item))
        .route("/api/v1/vault/share", post(share_vault_item))
        .route("/api/v1/admin/stats", get(admin_stats))
        .with_state(app_state)
        .layer(cors);

    let addr = SocketAddr::from(([0, 0, 0, 0], 8000));
    info!("NEXVAULT backend listening on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn health_check(State(_state): State<AppState>) -> JsonResponse<HealthResponse> {
    JsonResponse::from(HealthResponse {
        status: "ok".to_string(),
        service: "nexvault-backend".to_string(),
        version: "0.1.0".to_string(),
        timestamp: Utc::now(),
        database: "postgresql-ready".to_string(),
    })
}

async fn register_handler(
    State(state): State<AppState>,
    Json(payload): Json<RegisterRequest>,
) -> Result<JsonResponse<AuthResponse>, StatusCode> {
    if payload.email.trim().is_empty() || payload.password.trim().len() < 8 {
        return Err(StatusCode::BAD_REQUEST);
    }

    let password_hash = hash_password(&payload.password).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let result = sqlx::query(
        "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'user') RETURNING id, email, role",
    )
    .bind(payload.email.trim())
    .bind(&password_hash)
    .fetch_one(&state.db)
    .await;

    match result {
        Ok(row) => {
            let user_id: Uuid = row.get("id");
            let email: String = row.get("email");
            let role: String = row.get("role");
            let token = create_jwt(&state.jwt_secret, &user_id.to_string(), &email, &role)
                .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

            Ok(JsonResponse::from(AuthResponse {
                token,
                user: UserSummary { id: user_id.to_string(), email, role },
            }))
        }
        Err(sqlx::Error::Database(ref db_err)) if db_err.is_unique_violation() => Err(StatusCode::CONFLICT),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

async fn login_handler(
    State(state): State<AppState>,
    Json(payload): Json<LoginRequest>,
) -> Result<JsonResponse<AuthResponse>, StatusCode> {
    if payload.email.trim().is_empty() || payload.password.trim().is_empty() {
        return Err(StatusCode::BAD_REQUEST);
    }

    let row = sqlx::query(
        "SELECT id, email, role, password_hash FROM users WHERE email = $1 AND is_active = true",
    )
    .bind(payload.email.trim())
    .fetch_optional(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let row = row.ok_or(StatusCode::UNAUTHORIZED)?;
    let user_id: Uuid = row.get("id");
    let email: String = row.get("email");
    let role: String = row.get("role");
    let password_hash: String = row.get("password_hash");

    if verify_password(&payload.password, &password_hash).is_err() {
        return Err(StatusCode::UNAUTHORIZED);
    }

    let token = create_jwt(&state.jwt_secret, &user_id.to_string(), &email, &role)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(JsonResponse::from(AuthResponse {
        token,
        user: UserSummary { id: user_id.to_string(), email, role },
    }))
}

async fn list_vault_items(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<JsonResponse<VaultResponse>, StatusCode> {
    let user = require_auth(&state, &headers)?;
    let owner_id = Uuid::parse_str(&user.user_id).map_err(|_| StatusCode::BAD_REQUEST)?;

    let rows = sqlx::query(
        "SELECT id, title, kind, favorite, encrypted_payload FROM vault_items WHERE user_id = $1 ORDER BY created_at DESC",
    )
    .bind(owner_id)
    .fetch_all(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let mut data = Vec::new();
    for row in rows {
        data.push(VaultItem {
            id: row.get::<Uuid, _>("id").to_string(),
            title: row.get("title"),
            kind: row.get("kind"),
            favorite: row.get("favorite"),
            encrypted_payload: row.get("encrypted_payload"),
        });
    }

    Ok(JsonResponse::from(VaultResponse { count: data.len(), data }))
}

async fn create_vault_item(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreateVaultRequest>,
) -> Result<JsonResponse<VaultItem>, StatusCode> {
    let user = require_auth(&state, &headers)?;

    let normalized_title = if payload.title.trim().is_empty() {
        if !payload.site.trim().is_empty() {
            payload.site.trim().to_string()
        } else if !payload.login.trim().is_empty() {
            payload.login.trim().to_string()
        } else {
            "Credential".to_string()
        }
    } else {
        payload.title.trim().to_string()
    };

    let normalized_kind = if payload.kind.trim().is_empty() {
        "login".to_string()
    } else {
        payload.kind.trim().to_string()
    };

    let normalized_payload = match payload.encrypted_payload {
        Some(value) => value,
        None => {
            serde_json::json!({
                "username": payload.login.trim(),
                "password": payload.password.trim(),
                "site": payload.site.trim(),
                "url": payload.url.trim(),
                "notes": payload.notes.trim(),
                "kind": normalized_kind
            })
        }
    };

    if normalized_title.is_empty() || normalized_kind.is_empty() {
        return Err(StatusCode::BAD_REQUEST);
    }

    let row = sqlx::query(
        "INSERT INTO vault_items (user_id, title, kind, favorite, encrypted_payload) VALUES ($1, $2, $3, $4, $5) RETURNING id, title, kind, favorite, encrypted_payload",
    )
    .bind(Uuid::parse_str(&user.user_id).map_err(|_| StatusCode::BAD_REQUEST)?)
    .bind(normalized_title)
    .bind(normalized_kind)
    .bind(payload.favorite)
    .bind(&normalized_payload)
    .fetch_one(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(JsonResponse::from(VaultItem {
        id: row.get::<Uuid, _>("id").to_string(),
        title: row.get("title"),
        kind: row.get("kind"),
        favorite: row.get("favorite"),
        encrypted_payload: row.get("encrypted_payload"),
    }))
}

async fn delete_vault_item(
    State(state): State<AppState>,
    headers: HeaderMap,
    AxumPath(item_id): AxumPath<String>,
) -> Result<StatusCode, StatusCode> {
    let user = require_auth(&state, &headers)?;

    let result = sqlx::query("DELETE FROM vault_items WHERE id = $1 AND user_id = $2")
        .bind(Uuid::parse_str(&item_id).map_err(|_| StatusCode::BAD_REQUEST)?)
        .bind(Uuid::parse_str(&user.user_id).map_err(|_| StatusCode::BAD_REQUEST)?)
        .execute(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if result.rows_affected() == 0 {
        Err(StatusCode::NOT_FOUND)
    } else {
        Ok(StatusCode::NO_CONTENT)
    }
}

async fn share_vault_item(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<ShareRequest>,
) -> Result<StatusCode, StatusCode> {
    let user = require_auth(&state, &headers)?;

    let recipient = sqlx::query("SELECT id FROM users WHERE email = $1 AND is_active = true")
        .bind(payload.recipient_email.trim())
        .fetch_optional(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let recipient_id: Uuid = match recipient {
        Some(row) => row.get("id"),
        None => return Err(StatusCode::NOT_FOUND),
    };

    let vault_item_id = Uuid::parse_str(&payload.vault_item_id).map_err(|_| StatusCode::BAD_REQUEST)?;

    let by_owner = sqlx::query("SELECT id FROM vault_items WHERE id = $1 AND user_id = $2")
        .bind(vault_item_id)
        .bind(Uuid::parse_str(&user.user_id).map_err(|_| StatusCode::BAD_REQUEST)?)
        .fetch_optional(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if by_owner.is_none() {
        return Err(StatusCode::FORBIDDEN);
    }

    sqlx::query(
        "INSERT INTO vault_shares (vault_item_id, owner_id, recipient_id, share_type) VALUES ($1, $2, $3, $4) ON CONFLICT (vault_item_id, recipient_id) DO UPDATE SET share_type = EXCLUDED.share_type",
    )
    .bind(vault_item_id)
    .bind(Uuid::parse_str(&user.user_id).map_err(|_| StatusCode::BAD_REQUEST)?)
    .bind(recipient_id)
    .bind(payload.share_type.trim())
    .execute(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(StatusCode::CREATED)
}

async fn admin_stats(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<JsonResponse<AdminStats>, StatusCode> {
    let user = require_auth(&state, &headers)?;

    if user.role != "admin" {
        return Err(StatusCode::FORBIDDEN);
    }

    let users: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM users")
        .fetch_one(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let vault_items: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM vault_items")
        .fetch_one(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let shares: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM vault_shares")
        .fetch_one(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(JsonResponse::from(AdminStats { users, vault_items, shares }))
}

fn require_auth(state: &AppState, headers: &HeaderMap) -> Result<AuthenticatedUser, StatusCode> {
    let authorization = headers
        .get(axum::http::header::AUTHORIZATION)
        .and_then(|value| value.to_str().ok())
        .ok_or(StatusCode::UNAUTHORIZED)?;

    let token = authorization
        .strip_prefix("Bearer ")
        .ok_or(StatusCode::UNAUTHORIZED)?;

    let claims = decode::<TokenClaims>(
        token,
        &DecodingKey::from_secret(state.jwt_secret.as_bytes()),
        &Validation::new(JwtAlgorithm::HS256),
    )
    .map_err(|_| StatusCode::UNAUTHORIZED)?
    .claims;

    Ok(AuthenticatedUser {
        user_id: claims.sub,
        email: claims.email,
        role: claims.role,
    })
}

fn create_jwt(secret: &str, user_id: &str, email: &str, role: &str) -> Result<String, jsonwebtoken::errors::Error> {
    let exp = (chrono::Utc::now() + chrono::Duration::days(1)).timestamp() as usize;

    let claims = TokenClaims {
        sub: user_id.to_string(),
        email: email.to_string(),
        role: role.to_string(),
        exp,
    };

    encode(
        &Header::new(jsonwebtoken::Algorithm::HS256),
        &claims,
        &EncodingKey::from_secret(secret.as_ref()),
    )
}

fn hash_password(password: &str) -> Result<String, anyhow::Error> {
    let salt = SaltString::generate(OsRng);
    let params = Params::new(65536, 2, 1, None).map_err(anyhow::Error::msg)?;
    let argon2 = Argon2::new(Algorithm::Argon2id, Version::V0x13, params);
    let password_hash = argon2
        .hash_password(password.as_bytes(), &salt)
        .map_err(anyhow::Error::msg)?
        .to_string();
    Ok(password_hash)
}

fn verify_password(password: &str, hashed_password: &str) -> Result<(), anyhow::Error> {
    let parsed_hash = PasswordHash::new(hashed_password).map_err(anyhow::Error::msg)?;
    Argon2::default()
        .verify_password(password.as_bytes(), &parsed_hash)
        .map_err(anyhow::Error::msg)?;
    Ok(())
}
