use js_sys::Uint8Array;
use pdf_extract::extract_text_from_mem_by_pages;
use wasm_bindgen::prelude::*;

// mod obsidian;

#[wasm_bindgen]
pub fn extract_pdf_text_by_pages(arr: Uint8Array) -> Result<js_sys::Array, JsError> {
    let pages = extract_text_from_mem_by_pages(&arr.to_vec())
        .map_err(|e| JsError::new(&e.to_string()))?;

    let result = js_sys::Array::new();
    for content in pages {
        result.push(&JsValue::from_str(&content));
    }

    Ok(result)
}

// #[wasm_bindgen]
// pub struct ExampleCommand {
//     id: JsString,
//     name: JsString,
// }

// #[wasm_bindgen]
// impl ExampleCommand {
//     #[wasm_bindgen(getter)]
//     pub fn id(&self) -> JsString {
//         self.id.clone()
//     }

//     #[wasm_bindgen(setter)]
//     pub fn set_id(&mut self, id: &str) {
//         self.id = JsString::from(id)
//     }

//     #[wasm_bindgen(getter)]
//     pub fn name(&self) -> JsString {
//         self.name.clone()
//     }

//     #[wasm_bindgen(setter)]
//     pub fn set_name(&mut self, name: &str) {
//         self.name = JsString::from(name)
//     }

//     pub fn callback(&self) {
//         obsidian::Notice::new("hello from rust");
//     }
// }

// #[wasm_bindgen]
// pub fn onload(plugin: &obsidian::Plugin) {
//     let cmd = ExampleCommand {
//         id: JsString::from("example"),
//         name: JsString::from("Example"),
//     };
//     plugin.addCommand(JsValue::from(cmd))
// }
