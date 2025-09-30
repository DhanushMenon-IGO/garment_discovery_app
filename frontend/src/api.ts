export async function run(seed: any){
  const base = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
  const res = await fetch(`${base}/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(seed)
  });
  if(!res.ok) throw new Error(`API error ${res.status}`)
  return res.json();
}
