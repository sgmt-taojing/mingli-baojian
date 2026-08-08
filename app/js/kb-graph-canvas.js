/**
 * ═══════════════════════════════════════════════════════════════
 *  命理宝鉴 · 知识图谱可视化引擎（Canvas 力导引图）
 *  版本: v1.0 (2026-08-08 R476)
 *  特性: 力导引布局 + 模块聚类 + 关系强度 + 交互探索
 * ═══════════════════════════════════════════════════════════════
 */

(function (global) {
  'use strict';

  // ── 默认配置 ──────────────────────────────────────────────
  const DEFAULTS = {
    canvas: null,
    width: 800,
    height: 600,
    nodeRadius: 20,
    linkDistance: 100,
    charge: -300,
    gravity: 0.05,
    friction: 0.9,
    alpha: 1,
    alphaDecay: 0.005,
    velocityDecay: 0.4,
    colors: {
      'bazi': '#ff6b6b',
      'ziwei': '#a29bfe',
      'qimen': '#fd79a8',
      'liuyao': '#fdcb6e',
      'liuren': '#6c5ce7',
      'meihua': '#00b894',
      'fengshui': '#0984e3',
      'tcm': '#e17055',
      'wuxing': '#55a3ff',
      'default': '#636e72',
    },
    onNodeClick: null,
    onNodeHover: null,
  };

  // ── 力导引模拟器 ─────────────────────────────────────────
  class ForceSimulator {
    constructor(nodes, links, options) {
      this.nodes = nodes.map(n => ({
        ...n,
        x: n.x || Math.random() * options.width,
        y: n.y || Math.random() * options.height,
        vx: 0, vy: 0,
        fx: n.fx, fy: n.fy,
      }));
      this.links = links.map(l => ({
        source: typeof l.source === 'object' ? l.source : this.nodes.find(n => n.id === l.source) || l.source,
        target: typeof l.target === 'object' ? l.target : this.nodes.find(n => n.id === l.target) || l.target,
        strength: l.strength || 1,
      }));
      this.options = options;
      this.alpha = options.alpha;
    }

    tick() {
      if (this.alpha < 0.005) return false;
      
      const { charge, linkDistance, gravity, friction } = this.options;

      // 引力（连线）
      for (const link of this.links) {
        const s = link.source, t = link.target;
        if (!s.x || !t.x) continue;
        let dx = t.x - s.x, dy = t.y - s.y;
        let dist = Math.sqrt(dx * dx + dy * dy) || 1;
        let diff = (dist - linkDistance) / dist * 0.1 * link.strength;
        let fx = dx * diff, fy = dy * diff;
        if (!s.fx) s.vx += fx;
        if (!s.fy) s.vy += fy;
        if (!t.fx) t.vx -= fx;
        if (!t.fy) t.vy -= fy;
      }

      // 斥力（电荷）
      const n = this.nodes.length;
      for (let i = 0; i < n; i++) {
        const a = this.nodes[i];
        for (let j = i + 1; j < n; j++) {
          const b = this.nodes[j];
          if (!a.x || !b.x) continue;
          let dx = b.x - a.x, dy = b.y - a.y;
          let dist2 = dx * dx + dy * dy || 1;
          let dist = Math.sqrt(dist2);
          let force = charge / dist2;
          let fx = (dx / dist) * force, fy = (dy / dist) * force;
          if (!a.fx) a.vx += fx;
          if (!a.fy) a.vy += fy;
          if (!b.fx) b.vx -= fx;
          if (!b.fy) b.vy -= fy;
        }
      }

      // 重力（向中心）
      const cx = this.options.width / 2, cy = this.options.height / 2;
      for (const node of this.nodes) {
        if (node.fx != null) { node.x = node.fx; continue; }
        if (node.fy != null) { node.y = node.fy; continue; }
        node.vx += (cx - node.x) * gravity;
        node.vy += (cy - node.y) * gravity;
        node.vx *= friction;
        node.vy *= friction;
        node.x += node.vx;
        node.y += node.vy;
      }

      this.alpha *= (1 - this.options.alphaDecay);
      return true;
    }
  }

  // ── 渲染器 ───────────────────────────────────────────────
  class KbGraphCanvas {
    constructor(container, options) {
      this.options = { ...DEFAULTS, ...options };
      this.container = typeof container === 'string' 
        ? document.querySelector(container) 
        : container;
      if (!this.container) return;
      
      this.canvas = this.options.canvas || document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d');
      this.canvas.width = this.options.width;
      this.canvas.height = this.options.height;
      this.canvas.style.maxWidth = '100%';
      this.canvas.style.height = 'auto';
      if (!this.options.canvas) {
        this.container.appendChild(this.canvas);
      }
      
      this.sim = null;
      this.hoveredNode = null;
      this.selectedNode = null;
      this.dragging = null;
      
      this._bindEvents();
    }

    setData(nodes, links) {
      this.sim = new ForceSimulator(nodes, links, this.options);
      this._animate();
    }

    _animate() {
      if (!this.sim) return;
      const running = this.sim.tick();
      this._render();
      if (running) {
        requestAnimationFrame(() => this._animate());
      }
    }

    _render() {
      const { ctx, canvas, options } = this;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 背景
      ctx.fillStyle = 'rgba(15, 24, 32, 0.95)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // 连线
      if (this.sim) {
        for (const link of this.sim.links) {
          const s = link.source, t = link.target;
          if (!s.x || !t.x) continue;
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(t.x, t.y);
          ctx.strokeStyle = `rgba(99, 179, 237, ${0.1 + link.strength * 0.3})`;
          ctx.lineWidth = 0.5 + link.strength * 1.5;
          ctx.stroke();
        }
        
        // 节点
        for (const node of this.sim.nodes) {
          const r = Math.max(8, options.nodeRadius * (node.weight || 1));
          const color = options.colors[node.module] || options.colors.default;
          
          // 光晕（hover/selected）
          if (node === this.hoveredNode || node === this.selectedNode) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, r + 8, 0, Math.PI * 2);
            ctx.fillStyle = color + '20';
            ctx.fill();
          }
          
          ctx.beginPath();
          ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.2)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          
          // 标签
          if (r >= 14 || node === this.hoveredNode) {
            ctx.fillStyle = '#e0e0e0';
            ctx.font = '11px "Noto Serif SC", serif';
            ctx.textAlign = 'center';
            ctx.fillText(node.label || node.id, node.x, node.y + r + 14);
          }
        }
      }
    }

    _bindEvents() {
      const canvas = this.canvas;
      
      canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);
        
        if (this.dragging) {
          this.dragging.fx = x;
          this.dragging.fy = y;
          if (this.sim) this.sim.alpha = 0.3;
          return;
        }
        
        this.hoveredNode = this._findNode(x, y);
        canvas.style.cursor = this.hoveredNode ? 'pointer' : 'default';
        if (this.options.onNodeHover && this.hoveredNode) {
          this.options.onNodeHover(this.hoveredNode);
        }
      });
      
      canvas.addEventListener('click', (e) => {
        if (this.hoveredNode) {
          this.selectedNode = this.hoveredNode;
          if (this.options.onNodeClick) {
            this.options.onNodeClick(this.hoveredNode);
          }
        }
      });
      
      canvas.addEventListener('mousedown', (e) => {
        if (this.hoveredNode) {
          this.dragging = this.hoveredNode;
        }
      });
      
      canvas.addEventListener('mouseup', () => {
        if (this.dragging) {
          this.dragging.fx = null;
          this.dragging.fy = null;
          this.dragging = null;
        }
      });
    }

    _findNode(x, y) {
      if (!this.sim) return null;
      const r = this.options.nodeRadius;
      for (const node of this.sim.nodes) {
        if (!node.x) continue;
        const dx = x - node.x, dy = y - node.y;
        if (dx * dx + dy * dy < r * r * 1.5) return node;
      }
      return null;
    }

    resize(width, height) {
      this.options.width = width;
      this.options.height = height;
      this.canvas.width = width;
      this.canvas.height = height;
      if (this.sim) {
        this.sim.options = { ...this.sim.options, width, height };
        this.sim.alpha = 0.3;
        this._animate();
      }
    }

    destroy() {
      this.sim = null;
      this.canvas.remove();
    }
  }

  global.KbGraphCanvas = KbGraphCanvas;
  global.ForceSimulator = ForceSimulator;

})(typeof window !== 'undefined' ? window : globalThis);
