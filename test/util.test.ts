import { sheets, css } from "../src/util";
import { expect } from "@open-wc/testing";

describe("util", () => {
  it("converts strings to stylesheets", async () => {
    const stringStyle = css`
      a {
        color: red;
      }
    `;
    const styles = sheets([stringStyle]);
    expect(styles.every((style) => style instanceof CSSStyleSheet)).to.be.true;
  });
});
