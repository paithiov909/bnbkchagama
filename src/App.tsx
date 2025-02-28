import { useRef, useState, useCallback, useEffect } from "react";
import { WebR, RCharacter } from "webr";
import { Tensor, FeatureExtractionPipeline } from '@huggingface/transformers';

import { FEExtractor, WebRInstance } from "./Wrapper";

import "@unocss/reset/tailwind-compat.css?url";
import "./mvp.css";

export const App = () => {
  const webr = useRef<WebR | null>(null);
  const extractor = useRef<FeatureExtractionPipeline | null>(null);
  const [target, setTarget] = useState("");
  const [msg, setMsg] = useState("モデルのダウンロードが終われば検索できます");
  const [result, setResult] = useState<(string | null)[]>([]);
  const [isWebRInitialized, setIsWebRInitialized] = useState(false);
  const [isPipelineInitialized, setIsPipelineInitialized] = useState(false);

  const initWebR = useCallback(async () => {
    if (!webr.current) {
      // Initializes the WebR instance and mounts the bundled packages
      console.info("Initializing WebR...");
      webr.current = await WebRInstance.getInstance();
      setIsWebRInitialized(true);
      console.info("WebR initialized🚀");
    }
  }, [])
  const initExtractor = useCallback(async () => {
    if (!extractor.current) {
      console.info("Initializing extractor...");
      extractor.current = await FEExtractor.getInstance();
      setIsPipelineInitialized(true);
      console.info("Extractor initialized✨")
    }
  }, [])

  useEffect(() => {
    initWebR()
    initExtractor()
  })

  async function search() {
    if (extractor.current && webr.current) {
      const embedding: Tensor = await extractor.current._call(target, {
        pooling: 'mean', normalize: true
      });
      // Needs to once convert to array,
      // otherwise it will be casted to a raw vector.
      await webr.current.objs.globalEnv.bind('input', Array.from(embedding.data));

      // Evaluate R code inside a shelter
      const shelter = await new webr.current.Shelter();
      try {
        const msgTitle = `『${target}』に似合うかもしれない称号は...`
        setMsg(msgTitle);
        const suggests = await shelter.evalR(`
          mat <- predict(pri, matrix(input, nrow = 1, ncol = 1024))
          suggestions <- hnsw_search(matrix(mat[1, 1:50], nrow = 1), idx, k = 8)
          labels[as.integer(suggestions[["idx"]])]
        `) as RCharacter;
        const ret = await suggests.toArray();
        // console.log(ret);
        setResult(ret);
      } finally {
        await shelter.purge();
      }
    }
  }

  return (
    <>
      <main className="max-w-lg">
        <header>
          <h1>グラブル称号検索</h1>
          <p>LLMを使って『あなたの名前』に似合いそうなグラブルの称号を検索できます</p>
        </header>
        <section>
          <form
            className="grid place-items-center"
            onSubmit={(e) => {
              e.preventDefault();
              search();
            }}
          >
            <label className="mb-6">
              <span className="text-color-red-500">【注意】</span>
              このWebアプリはバカのアプリなので、
              <span className="underline">アクセスするだけで、600MB程度のアセットのダウンロードが始まります</span>。
              使いたくない場合、このページを閉じてください
            </label>
            <input
              id="search"
              type="text"
              maxLength={16}
              onChange={(e) => setTarget(e.currentTarget.value)}
              placeholder="あなたの名前"
            />
            <button
              type="submit"
              disabled={!(isWebRInitialized && isPipelineInitialized)}
            >検索</button>
          </form>
        </section>
        <section className="min-h-60">
          <article>
            <h3>{msg}</h3>
            <ul>
              {result?.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </article>
        </section>
      </main>
      <footer className="grid place-content-center max-w-lg">
        <div>
          <p>&copy; 2025 paithiov909.｜
             <a href="https://github.com/paithiov909/bnbkchagama" target="_blank" rel="noopener noreferrer">GitHub repo</a>
          </p>
        </div>
      </footer>
    </>
  );
}
