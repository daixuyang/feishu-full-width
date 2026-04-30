// ==UserScript==
// @name         飞书文档自动全屏宽度
// @name:zh-CN   飞书文档自动全屏宽度
// @name:en      Feishu Doc Auto Full Width
// @namespace    https://greasyfork.org/zh-CN/users/811937-daixuyang
// @version      1.5
// @description  自动将飞书/Lark文档页面宽度设置为全屏模式，无需手动切换
// @description:zh-CN  自动将飞书/Lark文档页面宽度设置为全屏模式，无需手动切换
// @description:en     Automatically set Feishu/Lark document page width to full mode
// @author       YourName
// @match        https://*.feishu.cn/wiki/*
// @match        https://*.feishu.cn/docx/*
// @match        https://*.feishu.cn/docs/*
// @match        https://*.larksuite.com/wiki/*
// @match        https://*.larksuite.com/docx/*
// @match        https://*.larksuite.com/docs/*
// @grant        none
// @run-at       document-start
// @license      MIT
// @supportURL   https://github.com/daixuyang/feishu-full-width/issues
// @homepageURL  https://github.com/daixuyang/feishu-full-width
// ==/UserScript==

(function () {
  'use strict';

  // document-start 阶段注入：全屏宽度样式 + 加载遮罩
  const s = document.createElement('style');
  s.textContent = `
    @keyframes fsPenMove {
      0% { transform: translate(15px, 65px); opacity: 0; }
      3% { transform: translate(15px, 65px); opacity: 1; }
      28% { transform: translate(185px, 65px); opacity: 1; }
      31% { transform: translate(15px, 85px); opacity: 1; }
      56% { transform: translate(185px, 85px); opacity: 1; }
      59% { transform: translate(15px, 105px); opacity: 1; }
      76% { transform: translate(130px, 105px); opacity: 1; }
      88% { transform: translate(130px, 105px); opacity: 1; }
      96%, 100% { transform: translate(130px, 105px); opacity: 0; }
    }
    @keyframes fsInkDotPulse {
      0%, 3% { opacity: 0; }
      5% { opacity: 1; }
      76% { opacity: 0.8; }
      88%, 100% { opacity: 0; }
    }
    @keyframes fsInkDraw1 {
      0%, 3% { stroke-dashoffset: 200; opacity: 0; }
      4% { stroke-dashoffset: 200; opacity: 1; }
      28% { stroke-dashoffset: 0; opacity: 1; }
      88% { stroke-dashoffset: 0; opacity: 1; }
      96%, 100% { stroke-dashoffset: 0; opacity: 0; }
    }
    @keyframes fsInkDraw2 {
      0%, 30% { stroke-dashoffset: 200; opacity: 0; }
      31% { stroke-dashoffset: 200; opacity: 1; }
      56% { stroke-dashoffset: 0; opacity: 1; }
      88% { stroke-dashoffset: 0; opacity: 1; }
      96%, 100% { stroke-dashoffset: 0; opacity: 0; }
    }
    @keyframes fsInkDraw3 {
      0%, 58% { stroke-dashoffset: 150; opacity: 0; }
      59% { stroke-dashoffset: 150; opacity: 1; }
      76% { stroke-dashoffset: 0; opacity: 1; }
      88% { stroke-dashoffset: 0; opacity: 1; }
      96%, 100% { stroke-dashoffset: 0; opacity: 0; }
    }

    .page-main-item.editor {
      width: auto !important;
      max-width: none !important;
      margin-left: 270px !important;
      margin-right: 48px !important;
    }
    .page-main-item.bidirection-link-list,
    .page-main-item.global-like-wrap,
    .page-main-item.docx-global-comment {
      width: auto !important;
      max-width: none !important;
      margin-left: 270px !important;
      margin-right: 48px !important;
    }

    .fs-doc-loading {
      position: fixed !important;
      top: 0 !important;
      bottom: 0 !important;
      z-index: 100 !important;
      background: #fff !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      transition: opacity 0.2s ease !important;
    }
    .fs-doc-loading.fs-hide {
      opacity: 0 !important;
      pointer-events: none !important;
    }
    .fs-doc-loading .fs-pen-svg {
      display: block !important;
      margin: 0 auto !important;
    }
    .fs-doc-loading .fs-pen-group {
      animation: fsPenMove 5s ease-in-out infinite !important;
    }
    .fs-doc-loading .fs-ink-dot {
      animation: fsInkDotPulse 5s ease-in-out infinite !important;
    }
    .fs-doc-loading .fs-ink {
      stroke-dasharray: 200 !important;
      stroke-dashoffset: 200 !important;
    }
    .fs-doc-loading .fs-ink.fs-ink-3 {
      stroke-dasharray: 150 !important;
      stroke-dashoffset: 150 !important;
    }
    .fs-doc-loading .fs-ink-1 { animation: fsInkDraw1 5s ease-in-out infinite !important; }
    .fs-doc-loading .fs-ink-2 { animation: fsInkDraw2 5s ease-in-out infinite !important; }
    .fs-doc-loading .fs-ink-3 { animation: fsInkDraw3 5s ease-in-out infinite !important; }
  `;
  (document.head || document.documentElement).appendChild(s);

  let safetyTimer = null;

  function showDocLoading() {
    removeDocLoading();
    const main = document.querySelector('.page-main');
    if (!main) return;
    const rect = main.getBoundingClientRect();
    const overlay = document.createElement('div');
    overlay.className = 'fs-doc-loading';
    overlay.style.left = rect.left + 'px';
    overlay.style.width = rect.width + 'px';
    overlay.innerHTML = `
      <svg class="fs-pen-svg" viewBox="-10 15 250 110" width="200" height="88">
        <line x1="15" y1="65" x2="185" y2="65" stroke="#ede9e3" stroke-width="0.5"/>
        <line x1="15" y1="85" x2="185" y2="85" stroke="#ede9e3" stroke-width="0.5"/>
        <line x1="15" y1="105" x2="130" y2="105" stroke="#ede9e3" stroke-width="0.5"/>
        <path class="fs-ink fs-ink-1" d="M15,65 C45,62 75,67 105,64 C135,61 165,66 185,64"
              stroke="#1e293b" fill="none" stroke-width="1.5" stroke-linecap="round"/>
        <path class="fs-ink fs-ink-2" d="M15,85 C45,82 75,87 105,84 C135,81 165,86 185,84"
              stroke="#1e293b" fill="none" stroke-width="1.5" stroke-linecap="round"/>
        <path class="fs-ink fs-ink-3" d="M15,105 C35,102 55,107 75,104 C95,101 115,106 130,104"
              stroke="#1e293b" fill="none" stroke-width="1.5" stroke-linecap="round"/>
        <g class="fs-pen-group">
          <circle class="fs-ink-dot" r="1.5" fill="#1e293b"/>
          <g transform="rotate(45)">
            <rect x="-4" y="-50" width="8" height="36" rx="2" fill="#1e293b"/>
            <rect x="-4.5" y="-50" width="9" height="2" rx="0.5" fill="#c9a96e"/>
            <rect x="-4.5" y="-47" width="9" height="1" rx="0.5" fill="#c9a96e"/>
            <rect x="3.5" y="-48" width="1.5" height="20" rx="0.5" fill="#c9a96e"/>
            <circle cx="4.25" cy="-28" r="0.8" fill="#c9a96e"/>
            <rect x="-3" y="-14" width="6" height="6" rx="1.5" fill="#475569"/>
            <line x1="-3" y1="-12" x2="3" y2="-12" stroke="#334155" stroke-width="0.5"/>
            <line x1="-3" y1="-10" x2="3" y2="-10" stroke="#334155" stroke-width="0.5"/>
            <path d="M-2,-8 L0,0 L2,-8" fill="#c9a96e"/>
            <path d="M-2,-8 L-0.3,0" stroke="#b8963e" stroke-width="0.3" fill="none"/>
            <path d="M2,-8 L0.3,0" stroke="#b8963e" stroke-width="0.3" fill="none"/>
            <circle cx="0" cy="-7.5" r="0.6" fill="#1e293b"/>
            <line x1="0" y1="-7" x2="0" y2="-0.5" stroke="#1e293b" stroke-width="0.3"/>
          </g>
        </g>
      </svg>`;
    document.body.appendChild(overlay);
    clearTimeout(safetyTimer);
    safetyTimer = setTimeout(removeDocLoading, 8000);
  }

  function removeDocLoading() {
    document.querySelectorAll('.fs-doc-loading').forEach(el => {
      if (el.classList.contains('fs-hide')) return;
      el.classList.add('fs-hide');
      const cleanup = () => el.remove();
      el.addEventListener('transitionend', cleanup, { once: true });
      setTimeout(cleanup, 300);
    });
  }

  function getCsrfToken() {
    const match = document.cookie.match(/_csrf_token=([^;]+)/);
    return match ? match[1] : '';
  }

  function getTokenFromUrl() {
    const m = location.pathname.match(/\/(wiki|docx|docs)\/([A-Za-z0-9]+)/);
    return m ? { type: m[1], token: m[2] } : null;
  }

  async function resolveObjToken(wikiToken) {
    const resp = await fetch(
      `/space/api/wiki/v2/tree/get_node/?wiki_token=${wikiToken}&expand_shortcut=true`,
      { credentials: 'include' }
    );
    const json = await resp.json();
    if (json.code !== 0) throw new Error('get_node failed: ' + json.msg);
    const d = json.data;
    if (!d?.obj_token) throw new Error('obj_token not found');
    return { objToken: d.obj_token, objType: d.obj_type };
  }

  async function setWidthMode(token, objType, mode) {
    const resp = await fetch('/space/api/platform/common_setting/update', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'x-csrftoken': getCsrfToken(),
      },
      body: JSON.stringify({
        token,
        obj_type: objType,
        settings: [{ scene: 'width_mode', setting_value: mode }],
      }),
    });
    const json = await resp.json();
    if (json.code !== 0) throw new Error('update failed: ' + json.msg);
  }

  async function applyWidthMode() {
    try {
      const parsed = getTokenFromUrl();
      if (!parsed) return;
      let objToken, objType;
      if (parsed.type === 'wiki') {
        const r = await resolveObjToken(parsed.token);
        objToken = r.objToken;
        objType = r.objType;
      } else {
        objToken = parsed.token;
        objType = 22;
      }
      await setWidthMode(objToken, objType, 'full');
    } catch (e) {
      console.error('[飞书全屏] API 设置失败:', e);
    }
    setTimeout(removeDocLoading, 300);
  }

  // 首次加载
  document.addEventListener('DOMContentLoaded', () => {
    showDocLoading();
    setTimeout(applyWidthMode, 3000);
  });

  // 目录树点击 → SPA 导航
  let lastUrl = location.href;

  function waitForUrlChange(attempts) {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      waitForEditor(0);
      return;
    }
    if (attempts > 30) { removeDocLoading(); return; }
    setTimeout(() => waitForUrlChange(attempts + 1), 150);
  }

  function waitForEditor(attempts) {
    if (!document.querySelector('.fs-doc-loading')) showDocLoading();
    if (document.querySelector('.page-main-item.editor')) { applyWidthMode(); return; }
    if (attempts > 30) { removeDocLoading(); return; }
    setTimeout(() => waitForEditor(attempts + 1), 200);
  }

  document.addEventListener('click', (e) => {
    if (e.target.closest('.workspace-tree-view-node-expand-arrow')) return;
    if (!e.target.closest('.workspace-tree-view-node')) return;
    showDocLoading();
    lastUrl = location.href;
    waitForUrlChange(0);
  }, true);
})();
