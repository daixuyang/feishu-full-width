// ==UserScript==
// @name         飞书文档自动全屏宽度
// @name:zh-CN   飞书文档自动全屏宽度
// @name:en      Feishu Doc Auto Full Width
// @namespace    https://greasyfork.org/zh-CN/users/811937-daixuyang
// @version      1.3
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

  // document-start 阶段注入：内容默认隐藏 + 全屏宽度样式
  const s = document.createElement('style');
  s.textContent = `
    @keyframes fsSpin { to { transform: rotate(360deg); } }

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

    .page-main:not(.fs-ready) .page-main-item { opacity: 0 !important; }
    .page-main.fs-ready .page-main-item {
      opacity: 1 !important;
      transition: opacity 0.2s ease !important;
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
    .fs-doc-loading .fs-spinner {
      width: 32px !important;
      height: 32px !important;
      border: 3px solid #e5e6eb !important;
      border-top-color: #3370ff !important;
      border-radius: 50% !important;
      animation: fsSpin 0.8s linear infinite !important;
    }
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
    overlay.innerHTML = '<div class="fs-spinner"></div>';
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

  function markReady() {
    document.querySelectorAll('.page-main').forEach(el => el.classList.add('fs-ready'));
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
    markReady();
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
