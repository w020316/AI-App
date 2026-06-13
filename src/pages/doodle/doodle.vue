<template>
	<view class="doodle-page" :class="{ 'page-leaving': isLeaving }">
		<!-- 顶部标题区 -->
		<view class="header">
			<view class="close-btn" @tap="goBack">
				<text class="close-icon">✕</text>
			</view>
			<view class="title-group">
				<text class="main-title">涂鸦中…</text>
				<text class="sub-title">请在实况图上自由涂画</text>
			</view>
		</view>

		<!-- 画布区 -->
		<view class="canvas-wrap">
			<view
				class="canvas-area"
				:style="{ width: canvasWidth + 'px', height: canvasHeight + 'px', backgroundColor: backgroundColor }"
				@touchstart="onTouchStart"
				@touchmove="onTouchMove"
				@touchend="onTouchEnd"
				@mousedown="onMouseDown"
				@mousemove="onMouseMove"
				@mouseup="onMouseUp"
			>
				<canvas
					canvas-id="doodleCanvas"
					id="doodleCanvas"
					class="doodle-canvas"
					:style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }"
				></canvas>

				<!-- 星星粒子层 -->
				<view class="particle-layer">
					<view
						v-for="p in particles"
						:key="p.id"
						class="star-particle"
						:style="{
							left: p.x + 'px',
							top: p.y + 'px',
							fontSize: p.size + 'px',
							transform: `translate(-50%, -50%) rotate(${p.rotation}deg)`
						}"
					>
						<text class="star-text">★</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 底部画笔面板 -->
		<view class="brush-panel">
			<view class="panel-header">
				<text class="panel-title">选择画笔</text>
				<view class="color-picker" @tap="toggleColorPanel">
					<view class="color-wheel" :style="{ background: currentColor }"></view>
				</view>
			</view>

			<view class="brush-grid">
				<view
					v-for="brush in brushes"
					:key="brush.id"
					class="brush-item"
					:class="{ active: currentBrush === brush.id }"
					@tap="selectBrush(brush.id)"
				>
					<view class="brush-preview">
						<template v-if="brush.id === 'marker'">
							<svg width="32" height="32" viewBox="0 0 32 32" fill="none">
								<path d="M6 26 Q16 6, 26 20" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" fill="none"/>
							</svg>
						</template>
						<template v-else-if="brush.id === 'neon'">
							<svg width="32" height="32" viewBox="0 0 32 32" fill="none">
								<path d="M6 26 Q16 6, 26 20" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" fill="none"/>
							</svg>
						</template>
						<template v-else-if="brush.id === 'star'">
							<text class="star-brush-text">✦✦\n✦</text>
						</template>
					</view>
				</view>
			</view>

			<view class="size-slider-wrap">
				<view class="slider-track">
					<slider
						class="size-slider"
						:value="brushSize"
						min="2"
						max="24"
						@change="onSizeChange"
						activeColor="transparent"
						backgroundColor="transparent"
						block-color="#FFFFFF"
						block-size="28"
					/>
				</view>
			</view>

			<!-- 颜色面板 -->
			<view v-if="showColorPanel" class="color-panel" @tap.stop>
				<view
					v-for="color in colorOptions"
					:key="color"
					class="color-option"
					:class="{ active: currentColor === color }"
					:style="{ backgroundColor: color }"
					@tap="selectColor(color)"
				></view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				canvasWidth: 353,
				canvasHeight: 470,
				backgroundColor: '#000000',
				isLeaving: false,
				currentBrush: 'marker',
				currentColor: '#FFFFFF',
				brushSize: 8,
				brushes: [
					{ id: 'marker', name: '马克笔' },
					{ id: 'neon', name: '荧光笔' },
					{ id: 'star', name: '星星' }
				],
				colorOptions: ['#FFFFFF', '#FFEB3B', '#FF5A36', '#8BC34A', '#03A9F4', '#E91E63', '#9C27B0', '#FF9800'],
				showColorPanel: false,
				doodlePaths: [],
				currentPath: null,
				particles: [],
				canvasOffsetX: 0,
				canvasOffsetY: 0,
				_isDrawing: false,
				_lastStarX: 0,
				_lastStarY: 0
			}
		},
		onLoad() {
			const sysInfo = uni.getSystemInfoSync()
			this.canvasWidth = sysInfo.windowWidth - 40
			this.canvasHeight = 470

			const eventChannel = this.getOpenerEventChannel && this.getOpenerEventChannel()
			if (eventChannel && eventChannel.on) {
				eventChannel.on('acceptCanvasData', (data) => {
					if (data) {
						this.backgroundColor = data.backgroundColor || '#000000'
						this.canvasWidth = data.canvasWidth || 353
						this.canvasHeight = data.canvasHeight || 470
						this.doodlePaths = data.doodlePaths || []
						this.$nextTick(() => {
							this.getCanvasOffset()
							this.redrawAllPaths()
						})
					}
				})
			}
		},
		onReady() {
			this.getCanvasOffset()
		},
		methods: {
			getCanvasOffset() {
				const query = uni.createSelectorQuery().in(this)
				query.select('.canvas-area').boundingClientRect(rect => {
					if (rect) {
						this.canvasOffsetX = rect.left
						this.canvasOffsetY = rect.top
					}
				}).exec()
			},
			selectBrush(id) {
				this.currentBrush = id
				if (id === 'marker') {
					this.brushSize = 8
				} else if (id === 'neon') {
					this.brushSize = 12
				} else if (id === 'star') {
					this.brushSize = 8
				}
			},
			onSizeChange(e) {
				this.brushSize = e.detail.value
			},
			toggleColorPanel() {
				this.showColorPanel = !this.showColorPanel
			},
			selectColor(color) {
				this.currentColor = color
				this.showColorPanel = false
			},

			// ========== 涂鸦绘制 ==========
			onTouchStart(e) {
				const touch = e.touches[0]
				this.startDrawing(touch.clientX, touch.clientY)
			},
			onTouchMove(e) {
				const touch = e.touches[0]
				this.drawMove(touch.clientX, touch.clientY)
			},
			onTouchEnd() {
				this.endDrawing()
			},
			onMouseDown(e) {
				// #ifdef H5
				this._isDrawing = true
				this.startDrawing(e.clientX, e.clientY)
				// #endif
			},
			onMouseMove(e) {
				// #ifdef H5
				if (!this._isDrawing) return
				this.drawMove(e.clientX, e.clientY)
				// #endif
			},
			onMouseUp() {
				// #ifdef H5
				this._isDrawing = false
				this.endDrawing()
				// #endif
			},
			startDrawing(clientX, clientY) {
				const x = clientX - this.canvasOffsetX
				const y = clientY - this.canvasOffsetY
				if (x < 0 || x > this.canvasWidth || y < 0 || y > this.canvasHeight) return

				this.currentPath = {
					brush: this.currentBrush,
					color: this.currentColor,
					width: this.brushSize,
					points: [{ x, y }],
					stars: []
				}
				this._lastStarX = x
				this._lastStarY = y
			},
			drawMove(clientX, clientY) {
				if (!this.currentPath) return
				const x = clientX - this.canvasOffsetX
				const y = clientY - this.canvasOffsetY
				if (x < 0 || x > this.canvasWidth || y < 0 || y > this.canvasHeight) return

				if (this.currentBrush === 'star') {
					const dist = Math.hypot(x - this._lastStarX, y - this._lastStarY)
					if (dist > 12) {
						this.addStarParticle(x, y)
						this.drawStarOnCanvas(x, y)
						this.currentPath.points.push({ x, y })
						this.currentPath.stars.push({
							x, y,
							rotation: Math.random() * 360,
							size: 8 + Math.random() * 4
						})
						this._lastStarX = x
						this._lastStarY = y
					}
				} else {
					this.currentPath.points.push({ x, y })
					this.drawCurrentSegment()
				}
			},
			endDrawing() {
				if (!this.currentPath) return
				if (this.currentPath.points.length > 0) {
					this.doodlePaths.push(this.currentPath)
				}
				this.currentPath = null
			},
			addStarParticle(x, y) {
				const id = Date.now() + Math.random()
				const size = 8 + Math.random() * 4
				const rotation = Math.random() * 360
				this.particles.push({ id, x, y, size, rotation })
				setTimeout(() => {
					const idx = this.particles.findIndex(p => p.id === id)
					if (idx !== -1) this.particles.splice(idx, 1)
				}, 800)
			},
			drawStarOnCanvas(x, y) {
				const ctx = uni.createCanvasContext('doodleCanvas', this)
				const size = 8 + Math.random() * 4
				const rotation = Math.random() * Math.PI * 2
				ctx.save()
				ctx.translate(x, y)
				ctx.rotate(rotation)
				ctx.beginPath()
				for (let i = 0; i < 5; i++) {
					const outerAngle = (Math.PI * 2 * i) / 5 - Math.PI / 2
					const innerAngle = outerAngle + Math.PI / 5
					ctx.lineTo(Math.cos(outerAngle) * size, Math.sin(outerAngle) * size)
					ctx.lineTo(Math.cos(innerAngle) * (size * 0.4), Math.sin(innerAngle) * (size * 0.4))
				}
				ctx.closePath()
				ctx.setFillStyle(this.currentColor)
				ctx.fill()
				ctx.restore()
				ctx.draw(true)
			},
			drawCurrentSegment() {
				if (!this.currentPath || this.currentPath.points.length < 2) return
				const ctx = uni.createCanvasContext('doodleCanvas', this)
				const points = this.currentPath.points
				const p1 = points[points.length - 2]
				const p2 = points[points.length - 1]

				ctx.beginPath()
				ctx.moveTo(p1.x, p1.y)
				ctx.lineTo(p2.x, p2.y)
				ctx.setStrokeStyle(this.currentColor)
				ctx.setLineWidth(this.brushSize)
				ctx.setLineCap('round')
				ctx.setLineJoin('round')

				if (this.currentBrush === 'marker') {
					ctx.setShadow(0, 0, 2, this.currentColor)
				} else if (this.currentBrush === 'neon') {
					ctx.setGlobalAlpha(0.6)
				}

				ctx.stroke()
				ctx.setShadow(0, 0, 0, 'transparent')
				ctx.setGlobalAlpha(1)
				ctx.draw(true)
			},
			redrawAllPaths() {
				const ctx = uni.createCanvasContext('doodleCanvas', this)
				ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight)
				this.doodlePaths.forEach(path => {
					this.redrawPath(ctx, path)
				})
				ctx.draw()
			},
			redrawPath(ctx, path) {
				if (path.brush === 'star') {
					(path.stars || []).forEach(star => {
						ctx.save()
						ctx.translate(star.x, star.y)
						ctx.rotate(star.rotation * Math.PI / 180)
						const size = star.size || 10
						ctx.beginPath()
						for (let i = 0; i < 5; i++) {
							const outerAngle = (Math.PI * 2 * i) / 5 - Math.PI / 2
							const innerAngle = outerAngle + Math.PI / 5
							ctx.lineTo(Math.cos(outerAngle) * size, Math.sin(outerAngle) * size)
							ctx.lineTo(Math.cos(innerAngle) * (size * 0.4), Math.sin(innerAngle) * (size * 0.4))
						}
						ctx.closePath()
						ctx.setFillStyle(path.color || '#FFFFFF')
						ctx.fill()
						ctx.restore()
					})
				} else if (path.points && path.points.length > 1) {
					ctx.beginPath()
					ctx.moveTo(path.points[0].x, path.points[0].y)
					for (let i = 1; i < path.points.length; i++) {
						ctx.lineTo(path.points[i].x, path.points[i].y)
					}
					ctx.setStrokeStyle(path.color || '#FFFFFF')
					ctx.setLineWidth(path.width || 3)
					ctx.setLineCap('round')
					ctx.setLineJoin('round')
					if (path.brush === 'marker') {
						ctx.setShadow(0, 0, 2, path.color || '#FFFFFF')
					} else if (path.brush === 'neon') {
						ctx.setGlobalAlpha(0.6)
					}
					ctx.stroke()
					ctx.setShadow(0, 0, 0, 'transparent')
					ctx.setGlobalAlpha(1)
				}
			},
			goBack() {
				this.isLeaving = true
				setTimeout(() => {
					const eventChannel = this.getOpenerEventChannel()
					if (eventChannel && eventChannel.emit) {
						eventChannel.emit('doodleComplete', {
							doodlePaths: this.doodlePaths
						})
					}
					uni.navigateBack()
				}, 250)
			}
		}
	}
</script>

<style lang="scss" scoped>
	.doodle-page {
		min-height: 100vh;
		background-color: #FFFFFF;
		padding-top: 59px;
		box-sizing: border-box;
		position: relative;
	}

	.doodle-page.page-leaving {
		animation: pageLeave 0.25s ease forwards;
	}

	@keyframes pageLeave {
		from {
			transform: translateY(0);
			opacity: 1;
		}
		to {
			transform: translateY(20px);
			opacity: 0;
		}
	}

	/* 顶部标题 */
	.header {
		width: 100%;
		padding: 0 20px;
		box-sizing: border-box;
		position: relative;
	}

	.close-btn {
		position: absolute;
		top: 0;
		left: 20px;
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10;
	}

	.close-icon {
		color: #1C1C1E;
		font-size: 18px;
		font-weight: 500;
	}

	.title-group {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		padding-left: 44px;
	}

	.main-title {
		font-size: 22px;
		font-weight: 700;
		color: #1C1C1E;
	}

	.sub-title {
		font-size: 13px;
		color: #C7C7CC;
		margin-top: 4px;
	}

	/* 画布区 */
	.canvas-wrap {
		margin: 16px 20px 0;
	}

	.canvas-area {
		width: calc(100vw - 40px);
		height: 470px;
		border-radius: 24px;
		position: relative;
		overflow: hidden;
	}

	.doodle-canvas {
		position: absolute;
		top: 0;
		left: 0;
		z-index: 2;
	}

	/* 星星粒子层 */
	.particle-layer {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: 3;
	}

	.star-particle {
		position: absolute;
		animation: starFadeOut 0.8s ease forwards;
		pointer-events: none;
	}

	.star-text {
		color: #FFFFFF;
		line-height: 1;
	}

	@keyframes starFadeOut {
		0% {
			opacity: 1;
			transform: translate(-50%, -50%) scale(1);
		}
		100% {
			opacity: 0;
			transform: translate(-50%, -50%) scale(0.5);
		}
	}

	/* 底部画笔面板 */
	.brush-panel {
		position: absolute;
		bottom: 0;
		left: 0;
		width: 100%;
		height: 180px;
		background: rgba(28, 28, 30, 0.82);
		backdrop-filter: blur(24px);
		border-radius: 24px 24px 0 0;
		padding: 16px 20px 34px;
		box-sizing: border-box;
		z-index: 20;
	}

	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
	}

	.panel-title {
		font-size: 14px;
		font-weight: 500;
		color: #FFFFFF;
	}

	.color-picker {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: conic-gradient(red, yellow, lime, cyan, blue, magenta, red);
		border: 2px solid rgba(255, 255, 255, 0.25);
		box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.15);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
	}

	.color-wheel {
		width: 22px;
		height: 22px;
		border-radius: 50%;
	}

	.brush-grid {
		display: flex;
		gap: 12px;
		margin-bottom: 16px;
	}

	.brush-item {
		width: 64px;
		height: 64px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1.5px solid transparent;
		cursor: pointer;
	}

	.brush-item.active {
		border-color: rgba(255, 255, 255, 0.4);
	}

	.brush-preview {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.star-brush-text {
		color: #FFFFFF;
		font-size: 20px;
		line-height: 1.2;
		text-align: center;
		white-space: pre-line;
	}

	/* 尺寸滑块 */
	.size-slider-wrap {
		width: 100%;
	}

	.slider-track {
		width: 100%;
		height: 4px;
		background: rgba(255, 255, 255, 0.15);
		border-radius: 2px;
		position: relative;
	}

	.size-slider {
		position: relative;
		z-index: 2;
	}

	/* 颜色面板 */
	.color-panel {
		position: absolute;
		bottom: 180px;
		right: 20px;
		background: rgba(28, 28, 30, 0.9);
		backdrop-filter: blur(10px);
		border-radius: 16px;
		padding: 12px;
		display: flex;
		gap: 10px;
		z-index: 30;
	}

	.color-option {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		border: 2px solid transparent;
		cursor: pointer;
	}

	.color-option.active {
		border-color: #FFFFFF;
		box-shadow: 0 0 6px rgba(255, 255, 255, 0.4);
	}
</style>
