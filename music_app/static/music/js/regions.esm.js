class t {
    constructor() {
        this.listeners = {}
    }
    on(t, e, i) {
        if (
            (this.listeners[t] || (this.listeners[t] = new Set()),
            this.listeners[t].add(e),
            null == i ? void 0 : i.once)
        ) {
            const i = () => {
                this.un(t, i), this.un(t, e)
            }
            return this.on(t, i), i
        }
        return () => this.un(t, e)
    }
    un(t, e) {
        var i
        null === (i = this.listeners[t]) || void 0 === i || i.delete(e)
    }
    once(t, e) {
        return this.on(t, e, { once: !0 })
    }
    unAll() {
        this.listeners = {}
    }
    emit(t, ...e) {
        this.listeners[t] && this.listeners[t].forEach((t) => t(...e))
    }
}
class e extends t {
    constructor(t) {
        super(), (this.subscriptions = []), (this.options = t)
    }
    onInit() {}
    _init(t) {
        ;(this.wavesurfer = t), this.onInit()
    }
    destroy() {
        this.emit('destroy'), this.subscriptions.forEach((t) => t())
    }
}
function i(t, e, i, n, s = 3, o = 0) {
    if (!t) return () => {}
    let r = () => {}
    const a = (a) => {
        console.log("touchhhhhhhhhhhhhhhhhhhhhhh")
        if (a.button !== o) return
        a.preventDefault(), a.stopPropagation()
        let l = a.clientX,
            h = a.clientY,
            d = !1
        const c = (n) => {
                n.preventDefault(), n.stopPropagation()
                const o = n.clientX,
                    r = n.clientY,
                    a = o - l,
                    c = r - h
                if (d || Math.abs(a) > s || Math.abs(c) > s) {
                    const n = t.getBoundingClientRect(),
                        { left: s, top: u } = n
                    d || (null == i || i(l - s, h - u), (d = !0)),
                        e(a, c, o - s, r - u),
                        (l = o),
                        (h = r)
                }
            },
            u = () => {
                d && (null == n || n()), r()
            },
            g = (t) => {
                ;(t.relatedTarget &&
                    t.relatedTarget !== document.documentElement) ||
                    u()
            },
            v = (t) => {
                d && (t.stopPropagation(), t.preventDefault())
            },
            p = (t) => {
                d && t.preventDefault()
            }
        document.addEventListener('pointermove', c),
            document.addEventListener('pointerup', u),
            document.addEventListener('pointerout', g),
            document.addEventListener('pointercancel', g),
            document.addEventListener('touchmove', p, { passive: !1 }),
            document.addEventListener('click', v, { capture: !0 }),
            (r = () => {
                document.removeEventListener('pointermove', c),
                    document.removeEventListener('pointerup', u),
                    document.removeEventListener('pointerout', g),
                    document.removeEventListener('pointercancel', g),
                    document.removeEventListener('touchmove', p),
                    setTimeout(() => {
                        document.removeEventListener('click', v, {
                            capture: !0
                        })
                    }, 10)
            })
    }
    return (
        t.addEventListener('pointerdown', a),
        () => {
            r(), t.removeEventListener('pointerdown', a)
        }
    )
}
function n(t, e) {
    const i = e.xmlns
        ? document.createElementNS(e.xmlns, t)
        : document.createElement(t)
    for (const [t, s] of Object.entries(e))
        if ('children' === t)
            for (const [t, s] of Object.entries(e))
                'string' == typeof s
                    ? i.appendChild(document.createTextNode(s))
                    : i.appendChild(n(t, s))
        else
            'style' === t
                ? Object.assign(i.style, s)
                : 'textContent' === t
                ? (i.textContent = s)
                : i.setAttribute(t, s.toString())
    return i
}
function s(t, e, i) {
    const s = n(t, e || {})
    return null == i || i.appendChild(s), s
}
class o extends t {
    constructor(t, e, i = 0) {
        var n, s, o, r, a, l, h, d
        super(),
            (this.totalDuration = e),
            (this.numberOfChannels = i),
            (this.minLength = 0),
            (this.maxLength = 1 / 0),
            (this.contentEditable = !1),
            (this.id = t.id || `region-${Math.random().toString(32).slice(2)}`),
            (this.start = this.clampPosition(t.start)),
            (this.end = this.clampPosition(
                null !== (n = t.end) && void 0 !== n ? n : t.start
            )),
            (this.drag = null === (s = t.drag) || void 0 === s || s),
            (this.resize = null === (o = t.resize) || void 0 === o || o),
            (this.color =
                null !== (r = t.color) && void 0 !== r
                    ? r
                    : 'rgba(0, 0, 0, 0.1)'),
            (this.minLength =
                null !== (a = t.minLength) && void 0 !== a
                    ? a
                    : this.minLength),
            (this.maxLength =
                null !== (l = t.maxLength) && void 0 !== l
                    ? l
                    : this.maxLength),
            (this.channelIdx =
                null !== (h = t.channelIdx) && void 0 !== h ? h : -1),
            (this.contentEditable =
                null !== (d = t.contentEditable) && void 0 !== d
                    ? d
                    : this.contentEditable),
            (this.element = this.initElement()),
            this.setContent(t.content),
            this.setPart(),
            this.renderPosition()
        if (t.MouseEvent) {
            this.initMouseEvents()
        }
    }
    clampPosition(t) {
        return Math.max(0, Math.min(this.totalDuration, t))
    }
    setPart() {
        const t = this.start === this.end
        this.element.setAttribute(
            'part',
            `${t ? 'marker' : 'region'} ${this.id}`
        )
    }
    addResizeHandles(t) {
        const e = {
                position: 'absolute',
                zIndex: '2',
                width: '6px',
                height: '100%',
                top: '0',
                cursor: 'ew-resize',
                wordBreak: 'keep-all'
            },
            n = s(
                'div',
                {
                    part: 'region-handle region-handle-left',
                    style: Object.assign(Object.assign({}, e), {
                        left: '0',
                        borderLeft: '4px solid rgba(233, 157, 66, 0.3)',
                        borderRadius: '2px 0 0 2px'
                    })
                },
                t
            ),
            o = s(
                'div',
                {
                    part: 'region-handle region-handle-right',
                    style: Object.assign(Object.assign({}, e), {
                        right: '0',
                        borderRight: '4px solid rgba(233, 157, 66, 0.3)',
                        borderRadius: '0 2px 2px 0'
                    })
                },
                t
            )
        i(
            n,
            (t) => this.onResize(t, 'start'),
            () => null,
            () => this.onEndResizing(),
            1
        ),
            i(
                o,
                (t) => this.onResize(t, 'end'),
                () => null,
                () => this.onEndResizing(),
                1
            )
    }
    removeResizeHandles(t) {
        const e = t.querySelector('[part*="region-handle-left"]'),
            i = t.querySelector('[part*="region-handle-right"]')
        e && t.removeChild(e), i && t.removeChild(i)
    }
    initElement() {
        const t = this.start === this.end
        let e = 0,
            i = 100
        this.channelIdx >= 0 &&
            this.channelIdx < this.numberOfChannels &&
            ((i = 100 / this.numberOfChannels), (e = i * this.channelIdx))
        const n = s('div', {
            style: {
                position: 'absolute',
                top: `${e}%`,
                height: `${i}%`,
                backgroundColor: t ? 'none' : this.color,
                borderLeft: t ? '2px solid ' + this.color : 'none',
                borderRadius: '2px',
                boxSizing: 'border-box',
                transition: 'background-color 0.2s ease',
                cursor: this.drag ? 'grab' : 'default',
                pointerEvents: 'all'
            }
        })
        return !t && this.resize && this.addResizeHandles(n), n
    }
    renderPosition() {
        const t = this.start / this.totalDuration,
            e = (this.totalDuration - this.end) / this.totalDuration
        ;(this.element.style.left = 100 * t + '%'),
            (this.element.style.right = 100 * e + '%')
    }
    toggleCursor(t) {
        this.drag && (this.element.style.cursor = t ? 'grabbing' : 'grab')
    }
    initMouseEvents() {
        const { element: t } = this
        t &&
            (t.addEventListener('click', (t) => this.emit('click', t)),
            t.addEventListener('mouseenter', (t) => this.emit('over', t)),
            t.addEventListener('mouseleave', (t) => this.emit('leave', t)),
            t.addEventListener('dblclick', (t) => this.emit('dblclick', t)),
            t.addEventListener('pointerdown', () => this.toggleCursor(!0)),
            t.addEventListener('pointerup', () => this.toggleCursor(!1)),
            i(
                t,
                (t) => this.onMove(t),
                () => this.toggleCursor(!0),
                () => {
                    this.toggleCursor(!1), this.drag && this.emit('update-end')
                }
            ),
            this.contentEditable &&
                this.content &&
                (this.content.addEventListener('click', (t) =>
                    this.onContentClick(t)
                ),
                this.content.addEventListener('blur', () =>
                    this.onContentBlur()
                )))
    }
    _onUpdate(t, e) {
        if (!this.element.parentElement) return
        const { width: i } = this.element.parentElement.getBoundingClientRect(),
            n = (t / i) * this.totalDuration,
            s = e && 'start' !== e ? this.start : this.start + n,
            o = e && 'end' !== e ? this.end : this.end + n,
            r = o - s
        s >= 0 &&
            o <= this.totalDuration &&
            s <= o &&
            r >= this.minLength &&
            r <= this.maxLength &&
            ((this.start = s),
            (this.end = o),
            this.renderPosition(),
            this.emit('update'),
            this.emit('update_location',this.start,this.end))
    }
    onMove(t) {
        this.drag && this._onUpdate(t)
    }
    onResize(t, e) {
        console.log('onResize ', t, e)
        this.resize && this._onUpdate(t, e)
    }
    onEndResizing() {
        this.resize && this.emit('update-end')
    }
    onContentClick(t) {
        t.stopPropagation()
        t.target.focus(), this.emit('click', t)
    }
    onContentBlur() {
        this.emit('update-end')
    }
    _setTotalDuration(t) {
        ;(this.totalDuration = t), this.renderPosition()
    }
    play() {
        this.emit('play')
    }
    setContent(t) {
        var e
        if ((null === (e = this.content) || void 0 === e || e.remove(), t)) {
            if ('string' == typeof t) {
                const e = this.start === this.end
                this.content = s('div', {
                    style: {
                        padding: `0.2em ${e ? 0.2 : 0.4}em`,
                        display: 'inline-block'
                    },
                    textContent: t
                })
            } else this.content = t
            this.contentEditable && (this.content.contentEditable = 'true'),
                this.content.setAttribute('part', 'region-content'),
                this.element.appendChild(this.content)
        } else this.content = void 0
    }
    setOptions(t) {
        var e, i
        if (
            (t.color &&
                ((this.color = t.color),
                (this.element.style.backgroundColor = this.color)),
            void 0 !== t.drag &&
                ((this.drag = t.drag),
                (this.element.style.cursor = this.drag ? 'grab' : 'default')),
            void 0 !== t.start || void 0 !== t.end)
        ) {
            const n = this.start === this.end
            ;(this.start = this.clampPosition(
                null !== (e = t.start) && void 0 !== e ? e : this.start
            )),
                (this.end = this.clampPosition(
                    null !== (i = t.end) && void 0 !== i
                        ? i
                        : n
                        ? this.start
                        : this.end
                )),
                this.renderPosition(),
                this.setPart()
        }
        if (
            (t.content && this.setContent(t.content),
            t.id && ((this.id = t.id), this.setPart()),
            void 0 !== t.resize && t.resize !== this.resize)
        ) {
            const e = this.start === this.end
            ;(this.resize = t.resize),
                this.resize && !e
                    ? this.addResizeHandles(this.element)
                    : this.removeResizeHandles(this.element)
        }
    }
    remove() {
        this.emit('remove'), this.element.remove(), (this.element = null)
    }
}
class r extends e {
    constructor(t) {
        super(t),
            (this.regions = []),
            (this.regionsContainer = this.initRegionsContainer())
    }
    static create(t) {
        return new r(t)
    }
    onInit() {
        if (!this.wavesurfer) throw Error('WaveSurfer is not initialized')
        this.wavesurfer.getWrapper().appendChild(this.regionsContainer)
        let t = []
        this.subscriptions.push(
            this.wavesurfer.on('timeupdate', (e) => {
                const i = this.regions.filter(
                    (t) =>
                        t.start <= e &&
                        (t.end === t.start ? t.start + 0.05 : t.end) >= e
                )
                i.forEach((e) => {
                    t.includes(e) || this.emit('region-in', e)
                }),
                    t.forEach((t) => {
                        i.includes(t) || this.emit('region-out', t)
                    }),
                    (t = i)
            })
        )
    }
    initRegionsContainer() {
        return s('div', {
            style: {
                position: 'absolute',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                zIndex: '3',
                pointerEvents: 'none'
            }
        })
    }
    getRegions() {
        return this.regions
    }
    avoidOverlapping(t) {
        if (!t.content) return
        const e = t.content,
            i = e.getBoundingClientRect(),
            n = this.regions
                .map((e) => {
                    if (e === t || !e.content) return 0
                    const n = e.content.getBoundingClientRect()
                    return i.left < n.left + n.width &&
                        n.left < i.left + i.width
                        ? n.height
                        : 0
                })
                .reduce((t, e) => t + e, 0)
        e.style.marginTop = `${n}px`
    }
    adjustScroll(t) {
        return
        var e, i
        const n =
            null ===
                (i =
                    null === (e = this.wavesurfer) || void 0 === e
                        ? void 0
                        : e.getWrapper()) || void 0 === i
                ? void 0
                : i.parentElement
        if (!n) return
        const { clientWidth: s, scrollWidth: o } = n
        if (o <= s) return
        const r = n.getBoundingClientRect(),
            a = t.element.getBoundingClientRect(),
            l = a.left - r.left,
            h = a.right - r.left
        l < 0 ? (n.scrollLeft += l) : h > s && (n.scrollLeft += h - s)
        console.log('lhs', l, h, s)
    }
    saveRegion(t) {
        this.regionsContainer.appendChild(t.element)
        this.avoidOverlapping(t), this.regions.push(t)
        const e = [
            t.on('update', () => {
                console.log('update_region')
                this.adjustScroll(t)
            }),
            t.on('update-end', () => {
                this.avoidOverlapping(t), this.emit('region-updated', t)
            }),
            t.on('play', () => {
                var e, i
                null === (e = this.wavesurfer) || void 0 === e || e.play(),
                    null === (i = this.wavesurfer) ||
                        void 0 === i ||
                        i.setTime(t.start)
            }),
            t.on('click', (e) => {
                this.emit('region-clicked', t, e)
            }),
            t.on('dblclick', (e) => {
                this.emit('region-double-clicked', t, e)
            }),
            t.once('remove', () => {
                e.forEach((t) => t()),
                    (this.regions = this.regions.filter((e) => e !== t)),
                    this.emit('region-removed', t)
            })
        ]
        this.subscriptions.push(...e), this.emit('region-created', t)
    }
    addRegion(t) {
        var e, i
        if (!this.wavesurfer) throw Error('WaveSurfer is not initialized')
        const n = this.wavesurfer.getDuration(),
            s =
                null ===
                    (i =
                        null === (e = this.wavesurfer) || void 0 === e
                            ? void 0
                            : e.getDecodedData()) || void 0 === i
                    ? void 0
                    : i.numberOfChannels,
            r = new o(t, n, s)
        return (
            n
                ? this.saveRegion(r)
                : this.subscriptions.push(
                      this.wavesurfer.once('ready', (t) => {
                          r._setTotalDuration(t), this.saveRegion(r)
                      })
                  ),
            r
        )
    }
    enableDragSelection(t, e = 3) {
        var n
        const s =
            null === (n = this.wavesurfer) || void 0 === n
                ? void 0
                : n.getWrapper()
        if (!(s && s instanceof HTMLElement)) return () => {}
        let r = null,
            a = 0
        return i(
            s,
            (t, e, i) => {
                r && r._onUpdate(t, i > a ? 'end' : 'start')
            },
            (e) => {
                var i, n
                if (((a = e), !this.wavesurfer)) return
                const s = this.wavesurfer.getDuration(),
                    l =
                        null ===
                            (n =
                                null === (i = this.wavesurfer) || void 0 === i
                                    ? void 0
                                    : i.getDecodedData()) || void 0 === n
                            ? void 0
                            : n.numberOfChannels,
                    { width: h } = this.wavesurfer
                        .getWrapper()
                        .getBoundingClientRect(),
                    d = (e / h) * s,
                    c = ((e + 5) / h) * s
                ;(r = new o(
                    Object.assign(Object.assign({}, t), { start: d, end: c }),
                    s,
                    l
                )),
                    this.regionsContainer.appendChild(r.element)
            },
            () => {
                r && (this.saveRegion(r), (r = null))
            },
            e
        )
    }
    clearRegions() {
        this.regions.forEach((t) => t.remove())
    }
    destroy() {
        this.clearRegions(), super.destroy(), this.regionsContainer.remove()
    }
}
export { r as default }
