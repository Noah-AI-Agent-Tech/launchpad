/**
 * The launch flow, against the demo store: read the artwork, "upload" the
 * metadata, sign and confirm, then list the token on its curve.
 *
 * Each step waits a moment so the progress the UI shows is visible; none of
 * them leaves the browser.
 */

import { wait } from "@/mocks/rng";
import { createToken, launchFigures, LAUNCH_FEE_SOL } from "@/mocks/store";

export { LAUNCH_FEE_SOL };

/** Opening market cap, raise and graduation market cap for a SOL-paired launch. */
export const LAUNCH_PRICING = launchFigures();

export type LaunchStep = "uploading" | "building" | "signing" | "confirming";

export type LaunchInput = {
  creator: string;
  name: string;
  symbol: string;
  description?: string;
  image: File;
  website?: string;
  twitter?: string;
  telegram?: string;
  /** Dev buy in SOL, as typed. */
  devBuySol: string;
};

export type LaunchResult = { mint: string; poolId: string; signature: string };

export async function launchToken(
  input: LaunchInput,
  onStep: (step: LaunchStep) => void,
  signal: AbortSignal,
): Promise<LaunchResult> {
  const devBuySol = Number(input.devBuySol) || 0;

  onStep("uploading");
  const [imgUrl] = await Promise.all([readAsDataUrl(input.image), wait(900, signal)]);

  onStep("building");
  await wait(600, signal);

  onStep("signing");
  await wait(900, signal);

  onStep("confirming");
  await wait(1100, signal);

  return createToken({
    creator: input.creator,
    name: input.name,
    symbol: input.symbol,
    description: input.description,
    imgUrl,
    website: input.website,
    twitter: input.twitter,
    telegram: input.telegram,
    devBuySol,
  });
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Couldn't read the image file."));
    reader.readAsDataURL(file);
  });
}
