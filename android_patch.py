import json
from pathlib import Path

root = Path("OpenJarvis")
cfg_path = root / "frontend/src-tauri/tauri.conf.json"
cfg = json.loads(cfg_path.read_text())
cfg["identifier"] = "com.openjarvis.mobile"
cfg.setdefault("bundle", {}).setdefault("android", {})["minSdkVersion"] = 24
cfg_path.write_text(json.dumps(cfg, indent=2) + "\n")

cargo = root / "frontend/src-tauri/Cargo.toml"
s = cargo.read_text()
desktop = '''[target.'cfg(not(target_os = "android"))'.dependencies]
tauri-plugin-shell = "2"
tauri-plugin-global-shortcut = "2"
tauri-plugin-autostart = "2"
tauri-plugin-single-instance = "2"
'''
for dep in [
    'tauri-plugin-shell = "2"\n',
    'tauri-plugin-global-shortcut = "2"\n',
    'tauri-plugin-autostart = "2"\n',
    'tauri-plugin-single-instance = "2"\n',
]:
    s = s.replace(dep, "")
marker = '[features]\n'
if desktop.strip() not in s:
    s = s.replace(marker, desktop + "\n" + marker)
cargo.write_text(s)

lib = root / "frontend/src-tauri/src/lib.rs"
s = lib.read_text()
s = s.replace('use tauri::menu::{MenuBuilder, MenuItemBuilder};\n', '')
s = s.replace('use tauri::tray::TrayIconBuilder;\n', '')
s = s.replace('use tauri_plugin_autostart::MacosLauncher;\n', '')

old_secure = '''fn secure_store_get(key_name: &str) -> Result<Option<String>, String> {
    validate_cloud_key_name(key_name)?;
    let entry = keyring::Entry::new(SECURE_KEY_SERVICE, key_name).map_err(|err| {
        format!(
            "Failed to open secure key storage for {}: {}",
            key_name, err
        )
    })?;
    match entry.get_password() {
        Ok(value) => Ok(Some(value)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(err) => Err(format!(
            "Failed to read {} from secure key storage: {}",
            key_name, err
        )),
    }
}

fn secure_store_set(key_name: &str, key_value: &str) -> Result<(), String> {
    validate_cloud_key_name(key_name)?;
    let entry = keyring::Entry::new(SECURE_KEY_SERVICE, key_name).map_err(|err| {
        format!(
            "Failed to open secure key storage for {}: {}",
            key_name, err
        )
    })?;
    if key_value.is_empty() {
        return match entry.delete_credential() {
            Ok(()) => Ok(()),
            Err(keyring::Error::NoEntry) => Ok(()),
            Err(err) => Err(format!(
                "Failed to remove {} from secure key storage: {}",
                key_name, err
            )),
        };
    }
    entry
        .set_password(key_value)
        .map_err(|err| format!("Failed to save {} in secure key storage: {}", key_name, err))
}
'''
new_secure = '''#[cfg(not(target_os = "android"))]
fn secure_store_get(key_name: &str) -> Result<Option<String>, String> {
    validate_cloud_key_name(key_name)?;
    let entry = keyring::Entry::new(SECURE_KEY_SERVICE, key_name).map_err(|err| {
        format!("Failed to open secure key storage for {}: {}", key_name, err)
    })?;
    match entry.get_password() {
        Ok(value) => Ok(Some(value)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(err) => Err(format!("Failed to read {} from secure key storage: {}", key_name, err)),
    }
}

#[cfg(not(target_os = "android"))]
fn secure_store_set(key_name: &str, key_value: &str) -> Result<(), String> {
    validate_cloud_key_name(key_name)?;
    let entry = keyring::Entry::new(SECURE_KEY_SERVICE, key_name).map_err(|err| {
        format!("Failed to open secure key storage for {}: {}", key_name, err)
    })?;
    if key_value.is_empty() {
        return match entry.delete_credential() {
            Ok(()) => Ok(()),
            Err(keyring::Error::NoEntry) => Ok(()),
            Err(err) => Err(format!("Failed to remove {} from secure key storage: {}", key_name, err)),
        };
    }
    entry.set_password(key_value)
        .map_err(|err| format!("Failed to save {} in secure key storage: {}", key_name, err))
}

#[cfg(target_os = "android")]
fn mobile_secret_path() -> std::path::PathBuf {
    std::path::PathBuf::from(home_dir()).join(".openjarvis-mobile-secrets.json")
}

#[cfg(target_os = "android")]
fn secure_store_get(key_name: &str) -> Result<Option<String>, String> {
    validate_cloud_key_name(key_name)?;
    let path = mobile_secret_path();
    let Ok(text) = std::fs::read_to_string(path) else { return Ok(None); };
    let map: std::collections::HashMap<String, String> =
        serde_json::from_str(&text).unwrap_or_default();
    Ok(map.get(key_name).cloned())
}

#[cfg(target_os = "android")]
fn secure_store_set(key_name: &str, key_value: &str) -> Result<(), String> {
    validate_cloud_key_name(key_name)?;
    let path = mobile_secret_path();
    let mut map: std::collections::HashMap<String, String> =
        std::fs::read_to_string(&path)
            .ok()
            .and_then(|t| serde_json::from_str(&t).ok())
            .unwrap_or_default();
    if key_value.is_empty() { map.remove(key_name); } else { map.insert(key_name.to_string(), key_value.to_string()); }
    if let Some(parent) = path.parent() { let _ = std::fs::create_dir_all(parent); }
    std::fs::write(path, serde_json::to_vec(&map).map_err(|e| e.to_string())?)
        .map_err(|e| format!("Failed to save mobile secret: {}", e))
}
'''
if old_secure not in s:
    raise SystemExit("secure-store block not found")
s = s.replace(old_secure, new_secure)

start = s.index('    tauri::Builder::default()\n        .manage(backend.clone())')
end = s.index('        .invoke_handler(tauri::generate_handler![', start)
replacement = '''    let builder = tauri::Builder::default()
        .manage(backend.clone())
        .manage(status.clone())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_dialog::init());

    #[cfg(not(target_os = "android"))]
    let builder = builder
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--hidden"]),
        ))
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_focus();
            }
        }));

    builder
        .setup(move |app| {
            #[cfg(not(target_os = "android"))]
            {
                use tauri::menu::{MenuBuilder, MenuItemBuilder};
                use tauri::tray::TrayIconBuilder;
                let show = MenuItemBuilder::with_id("show", "Show / Hide").build(app)?;
                let health = MenuItemBuilder::with_id("health", "Health: starting...")
                    .enabled(false)
                    .build(app)?;
                let quit = MenuItemBuilder::with_id("quit", "Quit OpenJarvis").build(app)?;
                let menu = MenuBuilder::new(app)
                    .item(&show)
                    .separator()
                    .item(&health)
                    .separator()
                    .item(&quit)
                    .build()?;
                let _tray = TrayIconBuilder::with_id("main")
                    .icon(app.default_window_icon().unwrap().clone())
                    .tooltip("OpenJarvis")
                    .menu(&menu)
                    .on_menu_event(move |app, event| match event.id().as_ref() {
                        "show" => {
                            if let Some(window) = app.get_webview_window("main") {
                                if window.is_visible().unwrap_or(false) {
                                    let _ = window.hide();
                                } else {
                                    let _ = window.show();
                                    let _ = window.set_focus();
                                }
                            }
                        }
                        "quit" => app.exit(0),
                        _ => {}
                    })
                    .build(app)?;

                use tauri_plugin_global_shortcut::{
                    Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState,
                };
                let sc = Shortcut::new(Some(Modifiers::META | Modifiers::SHIFT), Code::Space);
                let _ = app.global_shortcut().on_shortcut(sc, |_app, _sc, ev| {
                    if ev.state == ShortcutState::Pressed {
                        #[cfg(target_os = "macos")]
                        unsafe { native_overlay::toggle(); }
                    }
                });
            }

            #[cfg(target_os = "macos")]
            unsafe {
                native_overlay::create(include_str!("overlay.html"), JARVIS_PORT);
            }

            #[cfg(not(target_os = "android"))]
            if configured_at_launch.is_some() {
                tauri::async_runtime::spawn(start_managed_boot(boot_backend_ref, boot_status_ref));
            }

            Ok(())
        })
'''
s = s[:start] + replacement + s[end:]
lib.write_text(s)

app = root / "frontend/src/App.tsx"
s = app.read_text()
s = s.replace(
    'const [setupDone, setSetupDone] = useState(!isTauri());',
    "const [setupDone, setSetupDone] = useState(!isTauri() || /Android/i.test(navigator.userAgent));"
)
app.write_text(s)

api = root / "frontend/src/lib/api.ts"
s = api.read_text()
s = s.replace(
    "export async function initApiBase(): Promise<void> {\n  if (!isTauri()) return;",
    "export async function initApiBase(): Promise<void> {\n  if (!isTauri() || /Android/i.test(navigator.userAgent)) return;"
)
api.write_text(s)
