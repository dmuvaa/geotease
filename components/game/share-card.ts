import type { Proximity } from "@/lib/game/proximity";

export type ShareCardModel = {
  kicker: string;
  title: string;
  score: string;
  detail: string;
  marks: Proximity[];
  link: string;
};

const MARK_COLOR: Record<Proximity, string> = {
  close: "#1f6b45",
  near: "#c4a15a",
  far: "#d64532",
  miss: "#8a8175",
};

export async function renderShareCard(card: ShareCardModel) {
  await document.fonts.ready;
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1080;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not draw the share card");
  }
  const styles = getComputedStyle(document.documentElement);
  const sans = styles.getPropertyValue("--font-geist-sans").trim() || "sans-serif";
  const serif = styles.getPropertyValue("--font-fraunces").trim() || "serif";

  context.fillStyle = "#f3efe6";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#d64532";
  context.fillRect(0, 0, canvas.width, 18);

  context.fillStyle = "#5e584e";
  context.font = `500 28px ${sans}`;
  context.letterSpacing = "6px";
  context.fillText(card.kicker.toUpperCase(), 84, 150);
  context.letterSpacing = "0px";

  context.fillStyle = "#1c1915";
  context.font = `560 78px ${serif}`;
  context.fillText(card.title, 84, 280);

  context.font = `560 132px ${serif}`;
  context.fillText(card.score, 84, 470);

  context.fillStyle = "#5e584e";
  context.font = `400 36px ${sans}`;
  context.fillText(card.detail, 84, 540);

  const size = 54;
  const gap = 16;
  const rowWidth = card.marks.length * size + Math.max(0, card.marks.length - 1) * gap;
  let x = (canvas.width - rowWidth) / 2;
  for (const mark of card.marks) {
    roundRect(context, x, 640, size, size, 12, MARK_COLOR[mark]);
    x += size + gap;
  }

  context.fillStyle = "#1c1915";
  context.font = `500 32px ${sans}`;
  context.fillText(card.link.replace(/^https:\/\//, ""), 84, 960);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) {
    throw new Error("Could not draw the share card");
  }
  return blob;
}

function roundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  color: string,
) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.fillStyle = color;
  context.fill();
}
