import puter from "@heyputer/puter.js";
import {
  createHostingSlug,
  fetchBlobFromUrl,
  getHostedUrl,
  getImageExtension,
  HOSTING_CONFIG_KEY,
  imageUrlToPngBlob,
  isHostedUrl,
} from "./utils";

export const getOrCreateHostingConfig =
  async (): Promise<HostingConfig | null> => {
    const exisitng = (await puter.kv.get(
      HOSTING_CONFIG_KEY,
    )) as HostingConfig | null;

    if (exisitng?.subdomain)
      return {
        subdomain: exisitng.subdomain,
      };

    const subdomain = createHostingSlug();

    try {
      const created = await puter.hosting.create(subdomain, ".");

      return { subdomain: created.subdomain };
    } catch (error) {
      console.warn(`Couldn't find subdomain`, error);
      return null;
    }
  };

export const uploadImageToHosting = async ({
  hosting,
  label,
  projectId,
  url,
}: StoreHostedImageParams): Promise<HostedAsset | null> => {
  if (!hosting || !url) return null;

  if (isHostedUrl(url)) return { url };

  try {
    const resolved =
      label === "rendered"
        ? await imageUrlToPngBlob(url).then((blob) =>
            blob ? { blob, contentType: "image/png" } : null,
          )
        : await fetchBlobFromUrl(url);

    if (!resolved) return null;

    const contentType = resolved.contentType || resolved.blob.type || "";
    const ext = getImageExtension(contentType, url);
    const dir = `project/${projectId}`;
    const filePath = `${dir}/${label}.${ext}`;

    const uploadFIle = new File([resolved.blob], `${label}.${ext}`, {
      type: contentType,
    });

    await puter.fs.mkdir(dir, { createMissingParents: true });
    await puter.fs.write(filePath, uploadFIle);

    const hostedUrl = getHostedUrl({ subdomain: hosting.subdomain }, filePath);

    return hostedUrl ? { url: hostedUrl } : null;
  } catch (error) {
    console.warn(`Couldn't find hosting url`, error);
    return null;
  }
};
