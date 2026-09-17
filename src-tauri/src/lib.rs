use base64::Engine;
use tauri_plugin_dialog::DialogExt;

/// Asks where to put an exported drawing, and puts it there.
///
/// Both ends of this belong to the app already — the bytes come from the
/// editor's own canvas, the path from a dialog opened here — so the write is
/// done in Rust rather than through the filesystem plugin. Going through the
/// plugin would mean granting the WebView a write scope wide enough to cover
/// anywhere the user might choose, which is to say all of it, and none of that
/// reach is needed to save one file.
///
/// Takes base64 rather than a `Vec<u8>` because a byte array crosses the IPC
/// boundary as a JSON array of numbers, which for a few megabytes of PNG or
/// PDF costs far more than decoding the string the sender produced anyway.
///
/// The save dialog's filter is picked from the filename extension. The
/// frontend passes `kicker.png` for the image export and `<title>.pdf` for
/// the build plan, and adding a new export format only involves teaching this
/// match arm about it — the plugin scope is unchanged either way.
///
/// `Ok(false)` means the user dismissed the dialog, which is not a failure.
#[tauri::command]
async fn save_export(
    app: tauri::AppHandle,
    filename: String,
    base64: String,
) -> Result<bool, String> {
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(base64)
        .map_err(|error| format!("The export was not valid base64: {error}"))?;

    let (filter_name, filter_extension) = match std::path::Path::new(&filename)
        .extension()
        .and_then(|extension| extension.to_str())
        .map(str::to_ascii_lowercase)
        .as_deref()
    {
        Some("pdf") => ("PDF document", "pdf"),
        // The PNG export is the fallback: an unknown extension almost
        // certainly means a new format the frontend has learned to build but
        // this branch has not yet. Offering it as PNG is wrong, but it is
        // wrong in the way that leaves the user with the file rather than
        // the save dialog refusing everything they might type.
        _ => ("PNG image", "png"),
    };

    /*
     * Blocking is safe here specifically because this is an async command, so
     * it is polled on the async runtime rather than the main thread. A dialog
     * opened from the main thread would deadlock the event loop it needs.
     */
    let Some(path) = app
        .dialog()
        .file()
        .set_file_name(&filename)
        .add_filter(filter_name, &[filter_extension])
        .blocking_save_file()
    else {
        return Ok(false);
    };

    let path = path
        .into_path()
        .map_err(|error| format!("That location cannot be written to: {error}"))?;

    std::fs::write(&path, bytes).map_err(|error| format!("Could not write the export: {error}"))?;

    Ok(true)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![save_export])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
