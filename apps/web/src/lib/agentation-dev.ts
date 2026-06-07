// Dev-only рантайм тулбара Agentation (визуальные аннотации для AI-агента).
//
// Подключается ИСКЛЮЧИТЕЛЬНО через динамический import() под `import.meta.env.DEV`
// (см. BaseLayout). В прод-сборке ветка статически ложна → Vite дропает и этот модуль,
// и сам пакет `agentation` из бандла. В dist ничего не утекает.
//
// Монтируем отдельным React-root вне дерева островов. ClientRouter не перезапускает
// скрипты при SPA-навигации, поэтому — тот же контракт, что у smooth.ts: ремоунт на
// `astro:page-load` (фаерится и на первой загрузке, и после каждой навигации),
// очистка на `astro:before-swap`. mount() идемпотентен.

import { createElement, type FunctionComponent } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Agentation } from "agentation";

// Пакет типизирует Agentation как функцию, возвращающую ReactPortal, из-за чего
// createElement не выводит пропсы. Сужаем до тех пропсов, что реально используем.
type AgentationProps = {
  endpoint?: string;
  onSessionCreated?: (sessionId: string) => void;
};
const Toolbar = Agentation as FunctionComponent<AgentationProps>;

let root: Root | null = null;
let host: HTMLElement | null = null;

function mount() {
  if (host || !document.body) return;
  host = document.createElement("div");
  host.id = "agentation-host";
  document.body.appendChild(host);
  root = createRoot(host);
  // endpoint → локальный agentation-mcp (порт 4747): тулбар синхронит аннотации
  // напрямую с агентом, без копипасты. Сервер поднимает Claude Code (stdio).
  root.render(
    createElement(Toolbar, {
      endpoint: "http://localhost:4747",
      onSessionCreated: (sessionId) =>
        console.info("[agentation] session:", sessionId),
    }),
  );
}

function unmount() {
  root?.unmount();
  root = null;
  host?.remove();
  host = null;
}

mount();
document.addEventListener("astro:page-load", mount);
document.addEventListener("astro:before-swap", unmount);
