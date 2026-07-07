export type ShopifyResourceType = "MODEL_3D" | "IMAGE";

interface UploadParams {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  resourceType: ShopifyResourceType;
}

/**
 * Uploads a file to Shopify's own CDN via the Files API, so it persists
 * permanently instead of living on the app server's disk (which is wiped
 * on every redeploy). Performs Shopify's 3-step process: stage the upload,
 * send the bytes, register the file, then poll until Shopify finishes
 * processing it before returning the final CDN URL.
 */
export async function uploadFileToShopify(
  admin: any,
  { buffer, filename, mimeType, resourceType }: UploadParams,
): Promise<{ url: string } | { error: string }> {
  const stagedResp = await admin.graphql(
    `#graphql
    mutation StageUpload($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets { url resourceUrl parameters { name value } }
        userErrors { field message }
      }
    }`,
    {
      variables: {
        input: [{
          filename,
          mimeType,
          fileSize: String(buffer.length),
          resource: resourceType,
          httpMethod: "POST",
        }],
      },
    },
  );
  const stagedData = await stagedResp.json();
  const stagedErrors = stagedData.data?.stagedUploadsCreate?.userErrors ?? [];
  if (stagedErrors.length > 0) {
    return { error: stagedErrors[0].message };
  }

  const target = stagedData.data?.stagedUploadsCreate?.stagedTargets?.[0];
  if (!target) {
    return { error: "Could not create an upload target" };
  }

  const uploadForm = new FormData();
  for (const p of target.parameters as { name: string; value: string }[]) {
    uploadForm.append(p.name, p.value);
  }
  uploadForm.append("file", new Blob([buffer], { type: mimeType }), filename);

  const uploadResp = await fetch(target.url, { method: "POST", body: uploadForm });
  if (!uploadResp.ok) {
    return { error: "File upload to Shopify storage failed" };
  }

  const createResp = await admin.graphql(
    `#graphql
    mutation CreateFile($files: [FileCreateInput!]!) {
      fileCreate(files: $files) {
        files { id fileStatus }
        userErrors { field message }
      }
    }`,
    {
      variables: {
        files: [{
          originalSource: target.resourceUrl,
          contentType: resourceType,
        }],
      },
    },
  );
  const createData = await createResp.json();
  const createErrors = createData.data?.fileCreate?.userErrors ?? [];
  if (createErrors.length > 0) {
    return { error: createErrors[0].message };
  }

  const fileId = createData.data?.fileCreate?.files?.[0]?.id;
  if (!fileId) {
    return { error: "File creation did not return an id" };
  }

  const fragment = resourceType === "MODEL_3D"
    ? `... on Model3d { fileStatus sources { url format } }`
    : `... on MediaImage { fileStatus image { url } }`;

  for (let attempt = 0; attempt < 20; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const pollResp = await admin.graphql(
      `#graphql
      query PollFile($id: ID!) {
        node(id: $id) { ${fragment} }
      }`,
      { variables: { id: fileId } },
    );
    const pollData = await pollResp.json();
    const node = pollData.data?.node;
    if (!node) continue;

    if (node.fileStatus === "READY") {
      if (resourceType === "MODEL_3D") {
        const glbSource = (node.sources ?? []).find((s: any) => s.format === "glb");
        if (glbSource?.url) return { url: glbSource.url };
        return { error: "Model processed but no GLB source was returned" };
      }
      if (node.image?.url) return { url: node.image.url };
      return { error: "Image processed but no URL was returned" };
    }

    if (node.fileStatus === "FAILED") {
      return { error: "Shopify failed to process the uploaded file" };
    }
  }

  return { error: "Timed out waiting for the file to finish processing" };
}
