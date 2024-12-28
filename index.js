require("update-electron-app")();

const { menubar } = require("menubar");
const Nucleus = require("nucleus-analytics");

const path = require("path");
const {
  app,
  nativeImage,
  Tray,
  Menu,
  globalShortcut,
  shell,
} = require("electron");
const contextMenu = require("electron-context-menu");

const image = nativeImage.createFromPath(
  path.join(__dirname, `images/newiconTemplate.png`)
);

app.on("ready", () => {
  Nucleus.init("638d9ccf4a5ed2dae43ce122");

  const tray = new Tray(image);

  const mb = menubar({
    browserWindow: {
      icon: image,
      transparent: path.join(__dirname, `images/iconApp.png`),
      webPreferences: {
        webviewTag: true,
        // nativeWindowOpen: true,
      },
      width: 450,
      height: 550,
    },
    tray,
    showOnAllWorkspaces: true,
    preloadWindow: true,
    showDockIcon: false,
    icon: image,
  });

  mb.on("ready", () => {
    const { window } = mb;


    if (process.platform !== "darwin") {
      window.setSkipTaskbar(true);
    } else {
      app.dock.hide();
    }

    const contextMenuTemplate = [
      // add links to github repo and vince's twitter
      {
        label: "Quit",
        accelerator: "Command+Q",
        click: () => {
          app.quit();
        },
      },
      {
        label: "Reload",
        accelerator: "Command+R",
        click: () => {
          window.reload();
        },
      },
      {
        label: "Open in browser",
        click: () => {
          shell.openExternal("https://chat.openai.com/chat");
        },
      },
      {
        type: "separator",
      },
      {
        label: "View on GitHub",
        click: () => {
          shell.openExternal("https://github.com/vincelwt/chatgpt-mac");
        },
      },
      {
        label: "Author on Twitter",
        click: () => {
          shell.openExternal("https://twitter.com/vincelwt");
        },
      },
      {
        type: "separator",
      },
      {
        label: "Zoom",
        submenu: [
          {
            label: "Zoom In",
            accelerator: "CommandOrControl+=",
            click: () => {
              const webContents = mb.window.webContents;
              const currentZoom = webContents.getZoomFactor();
              webContents.setZoomFactor(currentZoom + 0.1);
            }
          },
          {
            label: "Zoom Out",
            accelerator: "CommandOrControl+-",
            click: () => {
              const webContents = mb.window.webContents;
              const currentZoom = webContents.getZoomFactor();
              const newZoom = Math.max(0.3, currentZoom - 0.1);
              webContents.setZoomFactor(newZoom);
            }
          },
          {
            label: "Reset Zoom",
            accelerator: "CommandOrControl+0",
            click: () => {
              mb.window.webContents.setZoomFactor(1.0);
            }
          }
        ]
      },
    ];

    tray.on("right-click", () => {
      mb.tray.popUpContextMenu(Menu.buildFromTemplate(contextMenuTemplate));
    });

    const menu = new Menu();

    globalShortcut.register("Command+Control+c", () => {
      if (window.isVisible()) {
        mb.hideWindow();
      } else {
        mb.showWindow();
        if (process.platform == "darwin") {
          mb.app.show();
        }
        mb.app.focus();
      }
    });

    Menu.setApplicationMenu(menu);

    // open devtools
    // window.webContents.openDevTools();

    console.log("Menubar app is ready.");
  });

  app.on("web-contents-created", (e, contents) => {
    if (contents.getType() == "webview") {
      // open link with external browser in webview
      contents.on("new-window", (e, url) => {
        e.preventDefault();
        shell.openExternal(url);
      });
      // set context menu in webview
      contextMenu({
        window: contents,
      });

      // we can't set the native app menu with "menubar" so need to manually register these events
      // register cmd+c/cmd+v events
      contents.on("before-input-event", (event, input) => {
        const { control, meta, key } = input;
        if (!control && !meta) return;
        
        switch(key) {
          case "=":
          case "+":
          case "plus":
          case "Equal":
            contents.setZoomFactor(contents.getZoomFactor() + 0.1);
            break;
          case "-":
            contents.setZoomFactor(Math.max(0.3, contents.getZoomFactor() - 0.1));
            break;
          case "0":
            contents.setZoomFactor(1.0);
            break;
          case "c": contents.copy(); break;
          case "v": contents.paste(); break;
          case "a": contents.selectAll(); break;
          case "z": contents.undo(); break;
          case "y": contents.redo(); break;
          case "q": app.quit(); break;
          case "r": contents.reload(); break;
        }
      });
    }
  });

  if (process.platform == "darwin") {
    // restore focus to previous app on hiding
    mb.on("after-hide", () => {
      mb.app.hide();
    });
  }

  // open links in new window
  // app.on("web-contents-created", (event, contents) => {
  //   contents.on("will-navigate", (event, navigationUrl) => {
  //     event.preventDefault();
  //     shell.openExternal(navigationUrl);
  //   });
  // });

  // prevent background flickering
  app.commandLine.appendSwitch(
    "disable-backgrounding-occluded-windows",
    "true"
  );
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
