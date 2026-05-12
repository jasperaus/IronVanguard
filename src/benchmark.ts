async function mockUpdateDoc(delay: number) {
  return new Promise(resolve => setTimeout(resolve, delay));
}

async function mockBatchCommit(delay: number) {
  return new Promise(resolve => setTimeout(resolve, delay));
}

async function runSequential(mechsCount: number) {
  const start = performance.now();
  for (let i = 0; i < mechsCount; i++) {
    // move
    await mockUpdateDoc(50);
    // attack
    await mockUpdateDoc(50);
    await mockUpdateDoc(50);
  }
  const end = performance.now();
  return end - start;
}

async function runBatched(mechsCount: number) {
  const start = performance.now();
  for (let i = 0; i < mechsCount; i++) {
    // move
    // batch.update() is sync
    // attack
    // batch.update() is sync
  }
  await mockBatchCommit(50);
  const end = performance.now();
  return end - start;
}

async function main() {
  const numMechs = 3; // Typically 3 AI mechs
  const seqTime = await runSequential(numMechs);
  const batchedTime = await runBatched(numMechs);
  console.log(`Sequential time: ${seqTime.toFixed(2)}ms`);
  console.log(`Batched time: ${batchedTime.toFixed(2)}ms`);
}

main();
