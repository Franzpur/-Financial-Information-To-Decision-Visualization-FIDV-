/*
 * Native CFBundleExecutable for Standard-Cube.app.
 * macOS Launch Services rejects shell scripts as app executables (kLSNoExecutableErr).
 * Build: ./scripts/build-standard-cube-app.sh
 */
#include <limits.h>
#include <mach-o/dyld.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

static void alert(const char *msg) {
  char cmd[2300];
  snprintf(cmd, sizeof(cmd),
           "/usr/bin/osascript -e 'display alert \"Standard-Cube\" message \"%s\" as critical' "
           ">/dev/null 2>&1",
           msg);
  system(cmd);
}

static int path_dirname(char *path) {
  char *slash = strrchr(path, '/');
  if (!slash) {
    return -1;
  }
  if (slash == path) {
    path[1] = '\0';
  } else {
    *slash = '\0';
  }
  return 0;
}

int main(int argc, char **argv) {
  (void)argc;
  (void)argv;

  char exe[PATH_MAX];
  uint32_t size = sizeof(exe);
  if (_NSGetExecutablePath(exe, &size) != 0) {
    alert("Cannot resolve app path.");
    return 1;
  }

  char resolved[PATH_MAX];
  if (!realpath(exe, resolved)) {
    strncpy(resolved, exe, sizeof(resolved) - 1);
    resolved[sizeof(resolved) - 1] = '\0';
  }

  /* .../Standard-Cube.app/Contents/MacOS/Standard-Cube → repo root */
  if (path_dirname(resolved) != 0 || path_dirname(resolved) != 0 ||
      path_dirname(resolved) != 0 || path_dirname(resolved) != 0) {
    alert("Bad app layout.");
    return 1;
  }

  char gui[PATH_MAX];
  snprintf(gui, sizeof(gui), "%s/ind-chain/scripts/launcher_gui.py", resolved);
  if (access(gui, R_OK) != 0) {
    alert("Missing launcher_gui.py. Keep Standard-Cube.app in the FIDV repo root.");
    return 1;
  }
  if (chdir(resolved) != 0) {
    alert("Cannot chdir to repo.");
    return 1;
  }

  const char *cands[] = {
      "/usr/bin/python3",
      "/opt/homebrew/bin/python3",
      "/usr/local/bin/python3",
      NULL,
  };
  const char *py = NULL;
  for (int i = 0; cands[i]; i++) {
    if (access(cands[i], X_OK) != 0) {
      continue;
    }
    char probe[PATH_MAX];
    snprintf(probe, sizeof(probe), "%s -c 'import tkinter' >/dev/null 2>&1", cands[i]);
    if (system(probe) == 0) {
      py = cands[i];
      break;
    }
  }
  if (!py) {
    alert("No python3 with tkinter. Install Python 3 (with Tcl/Tk), then retry.");
    return 1;
  }

  char logpath[PATH_MAX];
  snprintf(logpath, sizeof(logpath), "%s/ind-chain/data/launcher-last.log", resolved);
  FILE *lf = fopen(logpath, "w");
  if (lf) {
    fprintf(lf, "exe=%s\nrepo=%s\npy=%s\ngui=%s\n", exe, resolved, py, gui);
    fclose(lf);
  }

  execl(py, py, gui, (char *)NULL);
  alert("Failed to exec python3.");
  return 1;
}
