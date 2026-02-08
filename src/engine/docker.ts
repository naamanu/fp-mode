import Docker from "dockerode";

let dockerInstance: Docker | null = null;

export function getDocker(): Docker {
  if (!dockerInstance) {
    dockerInstance = new Docker();
  }
  return dockerInstance;
}

export async function isDockerAvailable(): Promise<boolean> {
  try {
    const docker = getDocker();
    await docker.ping();
    return true;
  } catch {
    return false;
  }
}

export async function ensureImage(imageName: string): Promise<void> {
  const docker = getDocker();
  try {
    const image = docker.getImage(imageName);
    await image.inspect();
  } catch {
    throw new Error(
      `Docker image "${imageName}" not found. Run "fp-mode setup" to build images.`,
    );
  }
}

export async function buildImage(
  dockerfilePath: string,
  contextPath: string,
  tag: string,
): Promise<void> {
  const docker = getDocker();
  const stream = await docker.buildImage(
    { context: contextPath, src: ["."] },
    { t: tag, dockerfile: dockerfilePath },
  );
  await new Promise<void>((resolve, reject) => {
    docker.modem.followProgress(
      stream,
      (err: Error | null) => {
        if (err) reject(err);
        else resolve();
      },
    );
  });
}
