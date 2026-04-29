// ==UserScript==
// @name         飞书文档自动全屏宽度
// @name:zh-CN   飞书文档自动全屏宽度
// @name:en      Feishu Doc Auto Full Width
// @namespace    https://greasyfork.org/zh-CN/users/811937-daixuyang
// @version      1.0
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

  // 尽早注入 CSS，在页面渲染前生效
  const s = document.createElement('style');
  s.textContent = `
    @keyframes fsFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .page-main-item.editor {
      width: auto !important;
      max-width: none !important;
      margin-left: 270px !important;
      margin-right: 48px !important;
      animation: fsFadeIn 0.15s ease-out 0.4s both !important;
    }
    .page-main-item.bidirection-link-list,
    .page-main-item.global-like-wrap,
    .page-main-item.docx-global-comment {
      width: auto !important;
      max-width: none !important;
      margin-left: 270px !important;
      margin-right: 48px !important;
    }
  `;
  (document.head || document.documentElement).appendChild(s);

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

  // 页面加载后调用 API 持久化设置
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(async () => {
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
    }, 3000);
  });
})();
