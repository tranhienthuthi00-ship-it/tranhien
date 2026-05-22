async function run() {
  const invidiousInstances = [
    "https://vid.puffyan.us",
    "https://inv.tux.pizza",
    "https://invidious.jing.rocks",
    "https://invidious.nerdvpn.de",
    "https://inv.riverside.rocks"
  ];
  
  for (const instance of invidiousInstances) {
    try {
      console.log("Trying", instance);
      const res = await fetch(`${instance}/api/v1/videos/jNQXAC9IVRw`);
      if (res.ok) {
        const data = await res.json();
        console.log("success via", instance);
        return;
      }
    } catch(e) {}
  }
}
run();
