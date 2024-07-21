import { useState, useEffect } from "react";
import {
  // convertFileSrc,
  invoke
} from "@tauri-apps/api/core";
import {
  // trace,
  info,
  // error,
  attachConsole
} from "@tauri-apps/plugin-log";
import { WebR, ChannelType, FSMountOptions, RString } from "webr";

import "./App.css";

let webR: WebR;
let didInit = false;

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    // Initializes the WebR instance and mounts the bundled packages
    async function initWebR() {
      webR = new WebR({
        baseUrl: "https://webr.r-wasm.org/v0.4.0/",
        serviceWorkerUrl: "https://webr.r-wasm.org/v0.4.0/webr-worker.js",
        channelType: ChannelType.PostMessage
      });
      const libData = await fetch(new URL("./assets/library.data", import.meta.url).href);
      const libMeta = await fetch(new URL("./assets/library.js.metadata", import.meta.url).href);
      const options: FSMountOptions = {
        packages: [{
          blob: await libData.blob(),
          metadata: await libMeta.json()
        }]
      };
      await webR.init();
      await webR.FS.mkdir("/data");
      await webR.FS.mount("WORKERFS", options, '/data');
      await webR.evalR(".libPaths(c(.libPaths(), '/data'))");
    }
    if (!didInit) {
      initWebR();
      setGreetMsg("WebR initialized");
      didInit = true;
    }
  });

  async function greet() {
    const detach = await attachConsole();

    // tauri command
    const greeting = await invoke("greet", { name }) as string;

    // eval R codes with WebR
    const shelter = await new webR.Shelter();
    try {
      const env = await new shelter.REnvironment({
        greeting: greeting
      });
      const ret = await shelter.evalR("paste(list.files('/data'), collapse = ', ')") as RString;
      info(`Bundled packages: ${await ret.toString()}`);

      const pasted = await shelter.evalR("paste(greeting, '(and from WebR!)')", {
        env
      }) as RString;
      setGreetMsg(await pasted.toString());
    } finally {
      await shelter.purge();
      detach();
    }
  }

  return (
    <div className="container">
      <h1>Welcome to Tauri!</h1>

      <div className="row">
        <a href="https://vitejs.dev" target="_blank">
          <img src="/vite.svg" className="logo vite" alt="Vite logo" />
        </a>
        <a href="https://tauri.app" target="_blank">
          <img src="/tauri.svg" className="logo tauri" alt="Tauri logo" />
        </a>
      </div>

      <p>Click on the Tauri, Vite, and React logos to learn more.</p>

      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          greet();
        }}
      >
        <input
          id="greet-input"
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Enter a name..."
        />
        <button type="submit">Greet</button>
      </form>

      <p>{greetMsg}</p>
    </div>
  );
}

export default App;
