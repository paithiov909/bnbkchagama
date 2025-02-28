import { WebR, ChannelType } from "webr";
import { FeatureExtractionPipeline, pipeline } from '@huggingface/transformers';

import json from "./data/embedding.json";
import labels from "./data/labels.json";

export class FEExtractor {
  static model = 'Snowflake/snowflake-arctic-embed-l-v2.0';
  static extractor: FeatureExtractionPipeline | null = null;

  static async getInstance() {
    if (this.extractor === null) {
      this.extractor = await pipeline('feature-extraction', this.model, {
        dtype: 'q8',
      });
    }
    return this.extractor;
  }
}

export class WebRInstance {
  static instance: WebR | null = null;
  static NROW = 3079; // FIXME: avoid hard-coding

  static async getInstance() {
    if (this.instance === null) {
      this.instance = new WebR({
        channelType: ChannelType.PostMessage
      });
      await this.instance.init();
      await this.instance.installPackages(["RcppHNSW", "codetools"]);
      await this.instance.objs.globalEnv.bind("labels", labels);
      await this.instance.objs.globalEnv.bind("dat", json);
      await this.instance.evalRVoid(`
        library(RcppHNSW)
        pri <- prcomp(matrix(dat, nrow = ${this.NROW}, ncol = 1024), center = TRUE, scale. = TRUE)
        idx <- hnsw_build(pri$x[, 1:50], distance = "l2", M = 24, ef = 100)
      `);
    }
    return this.instance;
  }
}
