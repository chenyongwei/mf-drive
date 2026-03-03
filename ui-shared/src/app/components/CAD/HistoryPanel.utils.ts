export function getRandomColor(userId: string): string {
  const colors = [
    '#ff6b6b', '#4a9eff', '#1dd1a1', '#ff9f43', '#5f27cd',
    '#c8d6e5', '#222f3e', '#ff9ff3', '#54a0ff', '#00d2d3',
  ];

  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}
