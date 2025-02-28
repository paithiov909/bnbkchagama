# bnbkchagama


## What is this?

LLMを使って、入力されたユーザー名に似合いそうなグラブルの称号を検索できるWebアプリです。

この機能は、[Transformers.js](https://huggingface.co/docs/transformers.js/index)を使って、入力されたユーザー名のベクトル表現を得たうえで、あらかじめ作成しておいた称号のベクトル表現との類似度が高い称号を検索することによって実現しています。

feature-extractionには、次のモデル（`Q8`で量子化されているもの）を利用しています。

- [Snowflake/snowflake-arctic-embed-l-v2.0 · Hugging
  Face](https://huggingface.co/Snowflake/snowflake-arctic-embed-l-v2.0)
- [Casual-Autopsy/snowflake-arctic-embed-l-v2.0-gguf · Hugging
  Face](https://huggingface.co/Casual-Autopsy/snowflake-arctic-embed-l-v2.0-gguf)

また、ベクトル検索は、[WebR](https://docs.r-wasm.org/webr/latest/)を使って、Rのコードを評価することでおこなっています。称号のベクトル表現をPCAによって次元削減した後、[RcppHNSW](https://github.com/jlmelville/rcpphnsw)でインデックスを作成し、ユーザー名のベクトル表現を同様にして次元削減したベクトルをクエリとして、近似最近傍探索しています。具体的には、だいたい次のような感じのことをしています。

``` r
dat <- arrow::read_parquet("scripts/gbf-title-emb.parquet")

pri <- prcomp(dat[, -1], center = TRUE, scale. = TRUE)

library(RcppHNSW)
idx <- hnsw_build(pri$x[, 1:50], distance = "l2", M = 24, ef = 100)
query <- predict(pri, as.matrix(dat[452, -1]))
suggestions <- hnsw_search(matrix(query[, 1:50], nrow = 1), idx, k = 8)

dat[452, "title"] # 仮のユーザー名
#> [1] "レヴィオンの英雄"
dat[as.integer(suggestions[["idx"]]), "title"] # 類似度が高い称号
#> [1] "レヴィオンの英雄"     "ダルモアの英雄"       "再起の英雄"          
#> [4] "ジェレミアの好敵手"   "ロンリーウルフ"       "レヴィオン王国騎士団"
#> [7] "アビス・リベレータ"   "エンシェントヒーロー"
```

## Limitations

- モデルをダウンロードするのに非常に時間がかかります（`onnx/model_quantized.onnx`という570MBのモデルがダウンロードされる）
- 日本語版の称号しか収録していません。また、収録している称号には漏れがある可能性があります

## Future plans?

これはもともと、WebRを利用しているWebアプリの例としてつくりはじめたものです。[Tauri](https://v2.tauri.app/)を使ってデスクトップアプリに固めたいと考えていましたが、Tauriは、WebRのようなスクリプトを外部から取得して実行する必要があるライブラリとは相性が悪そうだったので、そのあたりは放置しています。
