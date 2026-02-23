const PROJECT_PREFIX = "roomify_project_";

const JSONError = (statusCode, message, extra = {}) => {
  return new Response(JSON.stringify({ error: message, ...extra }), {
    status: statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
};

const getUserId = async (userPuter) => {
  try {
    const user = await userPuter.auth.getUser();
    return user?.uuid || null;
  } catch (error) {
    return null;
  }
};

router.post("/api/projects/save", async ({ request, user }) => {
  try {
    const userPuter = user.puter;
    if (!userPuter) {
      return JSONError(401, "Unauthorized");
    }

    const body = await request.json();
    const project = body?.project;

    if (!project?.id || project?.sourceImage)
      return JSONError(400, "Project ID and source image are required");

    const payload = {
      ...project,
      updatedAt: new Date().toISOString(),
    };

    const userId = await getUserId(userPuter);
    if (!userId) return JSONError(401, "Authentication failed");

    const key = `${PROJECT_PREFIX}${project.id}`;
    await userPuter.kv.set(key, payload);

    return { saved: true, id: project.id, project: payload };
  } catch (error) {
    return JSONError(500, "Failed to save project", {
      message: error.message || "Unknown error occurred",
    });
  }
});

router.get("/api/projects/list", async ({ params, user }) => {
  try {
    const userPuter = user.puter;
    if (!userPuter) {
      return JSONError(401, "Authenticated failed");
    }

    const userId = await getUserId(userPuter);
    if (!userId) return JSONError(401, "Authentication failed");

    const projects = (await userPuter.kv.list(PROJECT_PREFIX, true)).map(
      ({ value }) => ({ ...value, isPublic: true }),
    );

    if (!projects) {
      return JSONError(404, "Project not found");
    }

    return { projects };
  } catch (error) {
    return JSONError(500, "Failed to retrieve project", {
      message: error.message || "Unknown error occurred",
    });
  }
});

router.get("/api/projects/get", async ({ request, user }) => {
  try {
    const userPuter = user.puter;
    if (!userPuter) {
      return JSONError(401, "Unauthorized");
    }

    const userId = await getUserId(userPuter);
    if (!userId) return JSONError(401, "Authentication failed");

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return JSONError(400, "Project ID is required");
    }

    const key = `${PROJECT_PREFIX}${id}`;
    const project = await userPuter.kv.get(key);

    if (!project) {
      return JSONError(404, "Project not found");
    }

    return { project };
  } catch (error) {
    return JSONError(500, "Failed to retrieve project", {
      message: error.message || "Unknown error occurred",
    });
  }
});

router.post("/api/projects/save", async ({ request, user }) => {
  try {
    const userPuter = user.puter;

    if (!userPuter) return JSONError(401, "Authentication failed");

    const body = await request.json();
    const project = body?.project;

    if (!project?.id || !project?.sourceImage)
      return JSONError(400, "Project ID and source image are required");

    const payload = {
      ...project,
      updatedAt: new Date().toISOString(),
    };

    const userId = await getUserId(userPuter);
    if (!userId) return JSONError(401, "Authentication failed");

    const key = `${PROJECT_PREFIX}${project.id}`;
    await userPuter.kv.set(key, payload);

    return { saved: true, id: project.id, project: payload };
  } catch (e) {
    return JSONError(500, "Failed to save project", {
      message: e.message || "Unknown error",
    });
  }
});
