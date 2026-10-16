export type LngLatTuple = [number, number];

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number) {
  return (radians * 180) / Math.PI;
}

export function greatCircle(start: LngLatTuple, end: LngLatTuple, steps = 72): LngLatTuple[] {
  const [startLng, startLat] = start;
  const [endLng, endLat] = end;
  const phi1 = toRadians(startLat);
  const lambda1 = toRadians(startLng);
  const phi2 = toRadians(endLat);
  const lambda2 = toRadians(endLng);
  const angularDistance = 2 * Math.asin(
    Math.min(
      1,
      Math.sqrt(
        Math.sin((phi2 - phi1) / 2) ** 2 +
          Math.cos(phi1) * Math.cos(phi2) * Math.sin((lambda2 - lambda1) / 2) ** 2,
      ),
    ),
  );

  if (angularDistance === 0) {
    return [start, end];
  }

  const points: LngLatTuple[] = [];
  for (let step = 0; step <= steps; step += 1) {
    const fraction = step / steps;
    const weightStart = Math.sin((1 - fraction) * angularDistance) / Math.sin(angularDistance);
    const weightEnd = Math.sin(fraction * angularDistance) / Math.sin(angularDistance);
    const x = weightStart * Math.cos(phi1) * Math.cos(lambda1) + weightEnd * Math.cos(phi2) * Math.cos(lambda2);
    const y = weightStart * Math.cos(phi1) * Math.sin(lambda1) + weightEnd * Math.cos(phi2) * Math.sin(lambda2);
    const z = weightStart * Math.sin(phi1) + weightEnd * Math.sin(phi2);
    const latitude = Math.atan2(z, Math.sqrt(x * x + y * y));
    const longitude = Math.atan2(y, x);
    points.push([toDegrees(longitude), toDegrees(latitude)]);
  }
  return points;
}

export function splitAntimeridian(points: LngLatTuple[]) {
  const lines: LngLatTuple[][] = [[]];
  for (const point of points) {
    const current = lines[lines.length - 1];
    const previous = current[current.length - 1];
    if (previous && Math.abs(point[0] - previous[0]) > 180) {
      lines.push([point]);
    } else {
      current.push(point);
    }
  }
  return lines.filter((line) => line.length > 1);
}
