/**
 * File: comfy_shared.js
 * Project: comfy_mtb
 * Author: Mel Massadian
 *
 * Copyright (c) 2023 Mel Massadian
 *
 */

// Reference the shared typedefs file
/// <reference path="../types/typedefs.js" />

import { app } from '../../scripts/app.js'

// - crude uuid
export function makeUUID() {
  let dt = new Date().getTime()
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = ((dt + Math.random() * 16) % 16) | 0
    dt = Math.floor(dt / 16)
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
  return uuid
}

//- local storage manager
export class LocalStorageManager {
  constructor(namespace) {
    this.namespace = namespace
  }

  _namespacedKey(key) {
    return `${this.namespace}:${key}`
  }

  set(key, value) {
    const serializedValue = JSON.stringify(value)
    localStorage.setItem(this._namespacedKey(key), serializedValue)
  }

  get(key, default_val = null) {
    const value = localStorage.getItem(this._namespacedKey(key))
    return value ? JSON.parse(value) : default_val
  }

  remove(key) {
    localStorage.removeItem(this._namespacedKey(key))
  }

  clear() {
    for (const key of Object.keys(localStorage).filter((k) =>
      k.startsWith(`${this.namespace}:`),
    )) {
      localStorage.removeItem(key)
    }
  }
}

// - log utilities

function createLogger(emoji, color, consoleMethod = 'log') {
  return (message, ...args) => {
    if (window.MTB?.DEBUG) {
      console[consoleMethod](
        `%c${emoji} ${message}`,
        `color: ${color};`,
        ...args,
      )
    }
  }
}

export const infoLogger = createLogger('i', 'yellow')
export const warnLogger = createLogger('!', 'orange', 'warn')
export const errorLogger = createLogger('🔥', 'red', 'error')
export const successLogger = createLogger('✅', 'green')

export const log = (...args) => {
  if (window.MTB?.DEBUG) {
    console.debug(...args)
  }
}

//- WIDGET UTILS
export const CONVERTED_TYPE = 'converted-widget'

export const hasWidgets = (node) => {
  if (!node.widgets || !node.widgets?.[Symbol.iterator]) {
    return false
  }
  return true
}

export const cleanupNode = (node) => {
  if (!hasWidgets(node)) {
    return
  }

  for (const w of node.widgets) {
    if (w.canvas) {
      w.canvas.remove()
    }
    if (w.inputEl) {
      w.inputEl.remove()
    }
    // calls the widget remove callback
    w.onRemoved?.()
  }
}

export function offsetDOMWidget(
  widget,
  ctx,
  node,
  widgetWidth,
  widgetY,
  height,
) {
  const margin = 10
  const elRect = ctx.canvas.getBoundingClientRect()
  const transform = new DOMMatrix()
    .scaleSelf(
      elRect.width / ctx.canvas.width,
      elRect.height / ctx.canvas.height,
    )
    .multiplySelf(ctx.getTransform())
    .translateSelf(margin, margin + widgetY)

  const scale = new DOMMatrix().scaleSelf(transform.a, transform.d)
  Object.assign(widget.inputEl.style, {
    transformOrigin: '0 0',
    transform: scale,
    left: `${transform.a + transform.e}px`,
    top: `${transform.d + transform.f}px`,
    width: `${widgetWidth - margin * 2}px`,
    // height: `${(widget.parent?.inputHeight || 32) - (margin * 2)}px`,
    height: `${(height || widget.parent?.inputHeight || 32) - margin * 2}px`,

    position: 'absolute',
    background: !node.color ? '' : node.color,
    color: !node.color ? '' : 'white',
    zIndex: 5, //app.graph._nodes.indexOf(node),
  })
}

/**
 * Extracts the type and link type from a widget config object.
 * @param {*} config
 * @returns
 */
export function getWidgetType(config) {
  // Special handling for COMBO so we restrict links based on the entries
  let type = config?.[0]
  let linkType = type
  if (Array.isArray(type)) {
    type = 'COMBO'
    linkType = linkType.join(',')
  }
  return { type, linkType }
}
export const setupDynamicConnections = (nodeType, prefix, inputType, opts) => {
  infoLogger('Setting up dynamic connections for', nodeType)
  const options = opts || {}
  const onNodeCreated = nodeType.prototype.onNodeCreated
  const inputList = typeof inputType === 'object'

  nodeType.prototype.onNodeCreated = function () {
    const r = onNodeCreated ? onNodeCreated.apply(this, []) : undefined
    this.addInput(`${prefix}_1`, inputList ? '*' : inputType)
    return r
  }

  const onConnectionsChange = nodeType.prototype.onConnectionsChange
<<<<<<< HEAD
  nodeType.prototype.onConnectionsChange = function (
    type,
    slotIndex,
    isConnected,
    link,
    ioSlot,
  ) {
    infoLogger(`Connection changed for ${this.type}`, {
      node: this,
      type,
      slotIndex,
      isConnected,
      link,
      ioSlot,
    })
    options.link = link
    options.ioSlot = ioSlot

||||||| dff5b22
  nodeType.prototype.onConnectionsChange = function (
    type,
    index,
    connected,
    link_info,
  ) {
=======

  /**
   * @param {OnConnectionsChangeParams} args
   */
  nodeType.prototype.onConnectionsChange = function (...args) {
    const [_type, index, connected, _link_info] = args
>>>>>>> main
    const r = onConnectionsChange
      ? onConnectionsChange.apply(
          this,
          type,
          slotIndex,
          isConnected,
          link,
          ioSlot,
        )
      : undefined
    dynamic_connection(
      this,
      slotIndex,
      isConnected,
      `${prefix}_`,
      inputType,
      options,
    )
    return r
  }
}
/**
 * cleanup dynamic inputs
 *
 * @param {import("../../../web/types/litegraph.d.ts").LGraphNode} node - The target node
 * @param {bool} connected - Was this event connecting or disconnecting
 * @param {string} connectionPrefix - The common prefix of the dynamic inputs
 * @param {string|[string]} connectionType - The type of the dynamic connection
 * @param {{nameInput?:[string]}} [opts] - extra options
 */

const clean_dynamic_state = (
  node,
  connected,
  connectionPrefix,
  connectionType,
  opts,
) => {
  infoLogger('CLEANING', { node, connectionPrefix, connectionType, opts })
  const options = opts || {}
  const nameArray = options.nameArray || []

  const listConnection = typeof connectionType === 'object'
  const conType = listConnection ? '*' : connectionType
  infoLogger('connected', connected)

  if (connected) {
    // Remove inputs and their widget if not linked.
    for (let n = 0; n < node.inputs.length; n++) {
      const element = node.inputs[n]
      if (!element.link) {
        if (node.widgets) {
          const w = node.widgets.find((w) => w.name === element.name)
          if (w) {
            w.onRemoved?.()
            node.widgets.length = node.widgets.length - 1
          }
        }
        node.removeInput(n)
      }
    }
  }
  // make inputs sequential again
  for (let i = 0; i < node.inputs.length; i++) {
    let name = `${connectionPrefix}${i + 1}`

    if (nameArray.length > 0) {
      name = i < nameArray.length ? nameArray[i] : name
    }

    node.inputs[i].label = name
    node.inputs[i].name = name
  }
  // add an extra input
  if (node.inputs[node.inputs.length - 1].link !== undefined) {
    const nextIndex = node.inputs.length
    let name = `${connectionPrefix}${nextIndex + 1}`
    if (nameArray.length > 0) {
      name = nextIndex < nameArray.length ? nameArray[nextIndex] : name
    }
    log(`Adding input ${nextIndex + 1} (${name})`)
    node.addInput(name, conType)
  }
}

/**
 * Main logic around dynamic inputs
 *
 * @param {import("../../../web/types/litegraph.d.ts").LGraphNode} node - The target node
 * @param {number} index - The slot index of the currently changed connection
 * @param {bool} connected - Was this event connecting or disconnecting
 * @param {string} [connectionPrefix] - The common prefix of the dynamic inputs
 * @param {string|[string]} [connectionType] - The type of the dynamic connection
 * @param {{nameInput?:[string]}} [opts] - extra options
 */
export const dynamic_connection = (
  node,
  index,
  connected,
  connectionPrefix = 'input_',
  connectionType = '*',
  opts = undefined,
) => {
  infoLogger('MTB Dynamic Connection', {
    node,
    node_inputs: node.inputs,
    index,
    connected,
    connectionPrefix,
    connectionType,
    opts,
  })
  const options = opts || {}
  if (!node.inputs[index].name.startsWith(connectionPrefix)) {
    return
  }

  const listConnection = typeof connectionType === 'object'

  const conType = listConnection ? '*' : connectionType
  const nameArray = options.nameArray || []

  // clean_dynamic_state(
  //   node,
  //   connected,
  //   connectionPrefix,
  //   connectionType,
  //   options,
  // )
  //

  if (connected) {
    // Remove inputs and their widget if not linked.
    for (let n = 0; n < node.inputs.length; n++) {
      const element = node.inputs[n]
      if (!element.link) {
        if (node.widgets) {
          const w = node.widgets.find((w) => w.name === element.name)
          if (w) {
            w.onRemoved?.()
            node.widgets.length = node.widgets.length - 1
          }
        }
        node.removeInput(n)
      }
    }
  }
  // make inputs sequential again
  for (let i = 0; i < node.inputs.length; i++) {
    let name = `${connectionPrefix}${i + 1}`

    if (nameArray.length > 0) {
      name = i < nameArray.length ? nameArray[i] : name
    }

    node.inputs[i].label = name
    node.inputs[i].name = name
  }

  // add an extra input
  if (node.inputs[node.inputs.length - 1].link !== undefined) {
    const nextIndex = node.inputs.length
    const name =
      nextIndex < nameArray.length
        ? nameArray[nextIndex]
        : `${connectionPrefix}${nextIndex + 1}`

    log(`Adding input ${nextIndex + 1} (${name})`)

    node.addInput(name, listConnection ? '*' : connectionType)
  }
}

/**
 * Calculate total height of DOM element child
 *
 * @param {HTMLElement} parentElement - The target dom element
 * @returns {number} the total height
 */
export function calculateTotalChildrenHeight(parentElement) {
  let totalHeight = 0

  for (const child of parentElement.children) {
    const style = window.getComputedStyle(child)

    // Get height as an integer (without 'px')
    const height = Number.parseInt(style.height, 10)

    // Get vertical margin as integers
    const marginTop = Number.parseInt(style.marginTop, 10)
    const marginBottom = Number.parseInt(style.marginBottom, 10)

    // Sum up height and vertical margins
    totalHeight += height + marginTop + marginBottom
  }

  return totalHeight
}
/**
 * Appends a callback to the extra menu options of a given node type.
 * @param {*} nodeType
 * @param {*} cb
 */
export function addMenuHandler(nodeType, cb) {
  const getOpts = nodeType.prototype.getExtraMenuOptions
  /**
   * @returns {ContextMenuItem[]} items
   */
  nodeType.prototype.getExtraMenuOptions = function () {
    const r = getOpts.apply(this, [])
    cb.apply(this, [])
    return r
  }
}

export function hideWidget(node, widget, suffix = '') {
  widget.origType = widget.type
  widget.hidden = true
  widget.origComputeSize = widget.computeSize
  widget.origSerializeValue = widget.serializeValue
  widget.computeSize = () => [0, -4] // -4 is due to the gap litegraph adds between widgets automatically
  widget.type = CONVERTED_TYPE + suffix
  widget.serializeValue = () => {
    // Prevent serializing the widget if we have no input linked
    const { link } = node.inputs.find((i) => i.widget?.name === widget.name)
    if (link == null) {
      return undefined
    }
    return widget.origSerializeValue
      ? widget.origSerializeValue()
      : widget.value
  }

  // Hide any linked widgets, e.g. seed+seedControl
  if (widget.linkedWidgets) {
    for (const w of widget.linkedWidgets) {
      hideWidget(node, w, `:${widget.name}`)
    }
  }
}

/**
 * Show widget
 *
 * @param {import("../../../web/types/litegraph.d.ts").IWidget} widget - target widget
 */
export function showWidget(widget) {
  widget.type = widget.origType
  widget.computeSize = widget.origComputeSize
  widget.serializeValue = widget.origSerializeValue

  delete widget.origType
  delete widget.origComputeSize
  delete widget.origSerializeValue

  // Hide any linked widgets, e.g. seed+seedControl
  if (widget.linkedWidgets) {
    for (const w of widget.linkedWidgets) {
      showWidget(w)
    }
  }
}

export function convertToWidget(node, widget) {
  showWidget(widget)
  const sz = node.size
  node.removeInput(node.inputs.findIndex((i) => i.widget?.name === widget.name))

  for (const widget of node.widgets) {
    widget.last_y -= LiteGraph.NODE_SLOT_HEIGHT
  }

  // Restore original size but grow if needed
  node.setSize([Math.max(sz[0], node.size[0]), Math.max(sz[1], node.size[1])])
}

export function convertToInput(node, widget, config) {
  hideWidget(node, widget)

  const { linkType } = getWidgetType(config)

  // Add input and store widget config for creating on primitive node
  const sz = node.size
  node.addInput(widget.name, linkType, {
    widget: { name: widget.name, config },
  })

  for (const widget of node.widgets) {
    widget.last_y += LiteGraph.NODE_SLOT_HEIGHT
  }

  // Restore original size but grow if needed
  node.setSize([Math.max(sz[0], node.size[0]), Math.max(sz[1], node.size[1])])
}

export function hideWidgetForGood(node, widget, suffix = '') {
  widget.origType = widget.type
  widget.origComputeSize = widget.computeSize
  widget.origSerializeValue = widget.serializeValue
  widget.computeSize = () => [0, -4] // -4 is due to the gap litegraph adds between widgets automatically
  widget.type = CONVERTED_TYPE + suffix
  // widget.serializeValue = () => {
  //     // Prevent serializing the widget if we have no input linked
  //     const w = node.inputs?.find((i) => i.widget?.name === widget.name);
  //     if (w?.link == null) {
  //         return undefined;
  //     }
  //     return widget.origSerializeValue ? widget.origSerializeValue() : widget.value;
  // };

  // Hide any linked widgets, e.g. seed+seedControl
  if (widget.linkedWidgets) {
    for (const w of widget.linkedWidgets) {
      hideWidgetForGood(node, w, `:${widget.name}`)
    }
  }
}

export function fixWidgets(node) {
  if (node.inputs) {
    for (const input of node.inputs) {
      log(input)
      if (input.widget || node.widgets) {
        // if (newTypes.includes(input.type)) {
        const matching_widget = node.widgets.find((w) => w.name === input.name)
        if (matching_widget) {
          // if (matching_widget.hidden) {
          //     log(`Already hidden skipping ${matching_widget.name}`)
          //     continue
          // }
          const w = node.widgets.find((w) => w.name === matching_widget.name)
          if (w && w.type !== CONVERTED_TYPE) {
            log(w)
            log(`hidding ${w.name}(${w.type}) from ${node.type}`)
            log(node)
            hideWidget(node, w)
          } else {
            log(`converting to widget ${w}`)

            convertToWidget(node, input)
          }
        }
      }
    }
  }
}
export function inner_value_change(widget, val, event = undefined) {
  let value = val
  if (widget.type === 'number' || widget.type === 'BBOX') {
    value = Number(value)
  } else if (widget.type === 'BOOL') {
    value = Boolean(value)
  }
  widget.value = corrected_value
  if (
    widget.options?.property &&
    node.properties[widget.options.property] !== undefined
  ) {
    node.setProperty(widget.options.property, value)
  }
  if (widget.callback) {
    widget.callback(widget.value, app.canvas, node, pos, event)
  }
}

//- COLOR UTILS
export function isColorBright(rgb, threshold = 240) {
  const brightess = getBrightness(rgb)
  return brightess > threshold
}

function getBrightness(rgbObj) {
  return Math.round(
    (Number.parseInt(rgbObj[0]) * 299 +
      Number.parseInt(rgbObj[1]) * 587 +
      Number.parseInt(rgbObj[2]) * 114) /
      1000,
  )
}
//- HTML / CSS UTILS
export const loadScript = (
  FILE_URL,
  async = true,
  type = 'text/javascript',
) => {
  return new Promise((resolve, reject) => {
    try {
      // Check if the script already exists
      const existingScript = document.querySelector(`script[src="${FILE_URL}"]`)
      if (existingScript) {
        resolve({ status: true, message: 'Script already loaded' })
        return
      }

      const scriptEle = document.createElement('script')
      scriptEle.type = type
      scriptEle.async = async
      scriptEle.src = FILE_URL

      scriptEle.addEventListener('load', (_ev) => {
        resolve({ status: true })
      })

      scriptEle.addEventListener('error', (_ev) => {
        reject({
          status: false,
          message: `Failed to load the script ${FILE_URL}`,
        })
      })

      document.body.appendChild(scriptEle)
    } catch (error) {
      reject(error)
    }
  })
}

export function defineClass(className, classStyles) {
  const styleSheets = document.styleSheets

  // Helper function to check if the class exists in a style sheet
  function classExistsInStyleSheet(styleSheet) {
    const rules = styleSheet.rules || styleSheet.cssRules
    for (const rule of rules) {
      if (rule.selectorText === `.${className}`) {
        return true
      }
    }
    return false
  }

  // Check if the class is already defined in any of the style sheets
  let classExists = false
  for (const styleSheet of styleSheets) {
    if (classExistsInStyleSheet(styleSheet)) {
      classExists = true
      break
    }
  }

  // If the class doesn't exist, add the new class definition to the first style sheet
  if (!classExists) {
    if (styleSheets[0].insertRule) {
      styleSheets[0].insertRule(`.${className} { ${classStyles} }`, 0)
    } else if (styleSheets[0].addRule) {
      styleSheets[0].addRule(`.${className}`, classStyles, 0)
    }
  }
}

/** Prefixes the node title with '[DEPRECATED]' and log the deprecation reason to the console.*/
export const addDeprecation = (nodeType, reason) => {
  const title = nodeType.title
  nodeType.title = `[DEPRECATED] ${title}`
  // console.log(nodeType)

  const styles = {
    title: 'font-size:1.3em;font-weight:900;color:yellow; background: black',
    reason: 'font-size:1.2em',
  }
  console.log(
    `%c!  ${title} is deprecated:%c ${reason}`,
    styles.title,
    styles.reason,
  )
}

const create_documentation_stylesheet = () => {
  const tag = 'mtb-documentation-stylesheet'

  let styleTag = document.head.querySelector(tag)

  if (!styleTag) {
    styleTag = document.createElement('style')
    styleTag.type = 'text/css'
    styleTag.id = tag

    styleTag.innerHTML = `
.documentation-popup {
    background: var(--comfy-menu-bg);
    position: absolute;
    color: var(--fg-color);
    font: 12px monospace;
    line-height: 1.5em;
    padding: 10px;
    border-radius: 6px;
    pointer-events: "inherit";
    z-index: 5;
    overflow: hidden;
}
.documentation-wrapper {
    padding: 0 2em;
    overflow: auto;
    max-height: 100%;
    /* Scrollbar styling for Chrome */
    &::-webkit-scrollbar {
       width: 6px;
    }
    &::-webkit-scrollbar-track {
       background: var(--bg-color);
    }
    &::-webkit-scrollbar-thumb {
       background-color: var(--fg-color);
       border-radius: 6px;
       border: 3px solid var(--bg-color);
    }
   
    /* Scrollbar styling for Firefox */
    scrollbar-width: thin;
    scrollbar-color: var(--fg-color) var(--bg-color);
    a {
      color: yellow;
    }
    a:visited {
      color: orange;
    }
    a:hover {
      color: red;
    }
}

.documentation-popup img {
  max-width: 100%;
}
.documentation-popup table {
  border-collapse: collapse;
  border: 1px var(--border-color) solid;
}
.documentation-popup th, 
.documentation-popup td {
  border: 1px var(--border-color) solid;
}
.documentation-popup th {
  background-color: var(--comfy-input-bg);
}`
    document.head.appendChild(styleTag)
  }
}
let documentationConverter

/**
 * Add documentation widget to the selected node
 * @param {NodeData} nodeData
 * @param {NodeType}  nodeType
 * @param {DocumentationOptions} opts
 */
export const addDocumentation = (
  nodeData,
  nodeType,
  opts = { icon_size: 14, icon_margin: 4 },
) => {
  if (!nodeData.description) {
    infoLogger(
      `Skipping ${nodeData.name} doesn't have a description, skipping...`,
    )
    return
  }

  if (!documentationConverter) {
    infoLogger('Initializing our mardown converter')
    documentationConverter = new showdown.Converter({
      tables: true,
      strikethrough: true,
      emoji: true,
      ghCodeBlocks: true,
      tasklists: true,
      ghMentions: true,
      smoothLivePreview: true,
      simplifiedAutoLink: true,
      parseImgDimensions: true,
      openLinksInNewWindow: true,
    })
  }

  const options = opts || {}
  const iconSize = options.icon_size || 14
  const iconMargin = options.icon_margin || 4
  let docElement = null
  let wrapper = null
  const drawFg = nodeType.prototype.onDrawForeground

  /**
   * @param {OnDrawForegroundParams} args
   */
  nodeType.prototype.onDrawForeground = function (...args) {
    const [ctx, _canvas] = args
    const r = drawFg ? drawFg.apply(this, args) : undefined

    if (this.flags.collapsed) return r

    // icon position
    const x = this.size[0] - iconSize - iconMargin

    if (this.show_doc && docElement === null) {
      create_documentation_stylesheet()

      docElement = document.createElement('div')
      docElement.classList.add('documentation-popup')
      document.body.appendChild(docElement)
      // docElement.innerHTML = documentationConverter.makeHtml(
      //   nodeData.description,
      // )

      wrapper = document.createElement('div')
      wrapper.classList.add('documentation-wrapper')
      wrapper.innerHTML = documentationConverter.makeHtml(nodeData.description)
      docElement.appendChild(wrapper)

      // resize handle
      const resizeHandle = document.createElement('div')
      resizeHandle.style.width = '10px'
      resizeHandle.style.height = '10px'
      // resizeHandle.style.background = 'gray'
      resizeHandle.style.position = 'absolute'
      resizeHandle.style.bottom = '0'
      resizeHandle.style.right = '0'
      // resizeHandle.style.left = '95%'
      resizeHandle.style.cursor = 'se-resize'
      resizeHandle.style.userSelect = 'none'

      const borderColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--border-color')
        .trim()
      resizeHandle.style.borderTop = '10px solid transparent'
      resizeHandle.style.borderLeft = '10px solid transparent'
      resizeHandle.style.borderBottom = `10px solid ${borderColor}`
      resizeHandle.style.borderRight = `10px solid ${borderColor}`

      wrapper.appendChild(resizeHandle)
      let isResizing = false

      let startX
      let startY
      let startWidth
      let startHeight

      resizeHandle.addEventListener('mousedown', (e) => {
        e.stopPropagation()
        isResizing = true
        startX = e.clientX
        startY = e.clientY
        startWidth = Number.parseInt(
          document.defaultView.getComputedStyle(docElement).width,
          10,
        )
        startHeight = Number.parseInt(
          document.defaultView.getComputedStyle(docElement).height,
          10,
        )
      })

      document.addEventListener('mousemove', (e) => {
        console.log('Moving mouse')
        if (!isResizing) return
        const newWidth = startWidth + e.clientX - startX
        const newHeight = startHeight + e.clientY - startY

        docElement.style.width = `${newWidth}px`
        docElement.style.height = `${newHeight}px`

        this.docPos = {
          width: `${newWidth}px`,
          height: `${newHeight}px`,
        }
      })

      document.addEventListener('mouseup', () => {
        isResizing = false
      })
    } else if (!this.show_doc && docElement !== null) {
      docElement.parentNode.removeChild(docElement)
      docElement = null
    }

    // reposition
    if (this.show_doc && docElement !== null) {
      const rect = ctx.canvas.getBoundingClientRect()

      const scaleX = rect.width / ctx.canvas.width
      const scaleY = rect.height / ctx.canvas.height
      const transform = new DOMMatrix()
        .scaleSelf(scaleX, scaleY)
        .multiplySelf(ctx.getTransform())
        .translateSelf(this.size[0] * scaleX, 0)
        .translateSelf(10, -32)

      const scale = new DOMMatrix().scaleSelf(transform.a, transform.d)

      Object.assign(docElement.style, {
        transformOrigin: '0 0',
        transform: scale,
        left: `${transform.a + transform.e}px`,
        top: `${transform.d + transform.f}px`,
        width: this.docPos ? this.docPos.width : `${this.size[0] * 1.5}px`,
        height: this.docPos?.height,
        // width: `${this.size[0] * 2}px`,
        // height: `${(widget.parent?.inputHeight || 32) - (margin * 2)}px`,
        // height: `${this.size[1] || this.parent?.inputHeight || 32}px`,

        // background: !node.color ? "" : node.color,
        // color: "blue", //!node.color ? "" : "white",
      })

      if (this.docPos === undefined) {
        this.docPos = {
          width: docElement.style.width,
          height: docElement.style.height,
        }
      }

      // docElement.style.left = 140 - rect.right + "px";
      // docElement.style.top = rect.top + "px";
    }

    ctx.save()
    ctx.translate(x, iconSize - 34) // Position the icon on the canvas
    ctx.scale(iconSize / 32, iconSize / 32) // Scale the icon to the desired size
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'

    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    ctx.lineWidth = 2.4
    // ctx.stroke(questionMark);
    ctx.font = 'bold 36px monospace'
    ctx.fillText('?', 0, 24)
    ctx.restore()

    return r
  }
  const mouseDown = nodeType.prototype.onMouseDown

  /**
   * @param {OnMouseDownParams} args
   */
  nodeType.prototype.onMouseDown = function (...args) {
    const [_event, localPos, _graphCanvas] = args
    const r = mouseDown ? mouseDown.apply(this, args) : undefined
    const iconX = this.size[0] - iconSize - iconMargin
    const iconY = iconSize - 34
    if (
      localPos[0] > iconX &&
      localPos[0] < iconX + iconSize &&
      localPos[1] > iconY &&
      localPos[1] < iconY + iconSize
    ) {
      // Pencil icon was clicked, open the editor
      // this.openEditorDialog();
      if (this.show_doc === undefined) {
        this.show_doc = true
      } else {
        this.show_doc = !this.show_doc
      }
      return true // Return true to indicate the event was handled
    }

    return r // Return false to let the event propagate

    // return r;
  }
}
