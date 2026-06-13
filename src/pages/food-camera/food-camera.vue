<template>
	<view class="camera-page">
		<!-- 状态栏占位 -->
		<view :style="{ height: statusBarHeight + 'px' }"></view>

		<!-- 顶部导航 -->
		<view class="nav-bar">
			<view class="nav-back" @tap="goBack">
				<text class="back-icon">‹</text>
			</view>
			<view class="nav-actions">
				<view class="nav-action-btn" @tap="toggleFlash">
					<text class="action-icon">⚡</text>
				</view>
				<view class="nav-action-btn" @tap="switchCamera">
					<text class="action-icon">↻</text>
				</view>
			</view>
		</view>

		<!-- 相机/预览区域 -->
		<view class="camera-area">
			<view v-if="!imageSrc" class="camera-placeholder">
				<text class="camera-hint">点击拍照或从相册选择</text>
			</view>
			<view v-else class="image-preview-wrap">
				<image class="preview-img" :src="imageSrc" mode="aspectFill"></image>
				<!-- AI识别中状态 -->
				<view v-if="isThinking" class="thinking-overlay">
					<text class="thinking-text">思考中...</text>
				</view>
			</view>
		</view>

		<!-- 底部操作区 -->
		<view class="bottom-area">
			<view v-if="!imageSrc" class="bottom-controls">
				<view class="album-btn" @tap="chooseFromAlbum">
					<text class="album-icon">🖼</text>
				</view>
				<view class="shutter-btn" @tap="takePhoto">
					<view class="shutter-inner"></view>
				</view>
				<view class="spacer"></view>
			</view>

			<view v-else class="bottom-controls">
				<view class="retake-btn" @tap="retake">
					<text class="retake-label">重拍</text>
				</view>
			</view>
		</view>

		<!-- 安全区占位 -->
		<view style="height: constant(safe-area-inset-bottom); height: env(safe-area-inset-bottom);"></view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				statusBarHeight: 0,
				imageSrc: '',
				isThinking: false,
				hasNavigated: false,
				flashOn: false,
				cameraDevice: 'back'
			}
		},
		onLoad() {
			const sysInfo = uni.getSystemInfoSync()
			this.statusBarHeight = sysInfo.statusBarHeight || 20
			this.hasNavigated = false
			this.isThinking = false
		},
		onShow() {
			if (this.hasNavigated) {
				this.hasNavigated = false
				this.isThinking = false
			}
		},
		methods: {
			goBack() {
				if (this.imageSrc) {
					this.imageSrc = ''
					this.isThinking = false
				} else {
					uni.navigateBack()
				}
			},
			toggleFlash() {
				this.flashOn = !this.flashOn
				uni.showToast({
					title: this.flashOn ? '闪光灯已开启' : '闪光灯已关闭',
					icon: 'none',
					duration: 800
				})
			},
			switchCamera() {
				this.cameraDevice = this.cameraDevice === 'back' ? 'front' : 'back'
				uni.showToast({
					title: this.cameraDevice === 'back' ? '后置摄像头' : '前置摄像头',
					icon: 'none',
					duration: 800
				})
			},
			takePhoto() {
				const that = this
				// H5端camera可能不支持，做兼容处理
				// #ifdef H5
				uni.chooseImage({
					count: 1,
					sourceType: ['album', 'camera'],
					success(res) {
						that.imageSrc = res.tempFilePaths[0]
						that.startRecognize()
					}
				})
				// #endif
				// #ifndef H5
				uni.chooseImage({
					count: 1,
					sourceType: ['camera'],
					success(res) {
						that.imageSrc = res.tempFilePaths[0]
						that.startRecognize()
					},
					fail() {
						// camera不可用时回退到album
						uni.chooseImage({
							count: 1,
							sourceType: ['album'],
							success(res) {
								that.imageSrc = res.tempFilePaths[0]
								that.startRecognize()
							}
						})
					}
				})
				// #endif
			},
			chooseFromAlbum() {
				const that = this
				uni.chooseImage({
					count: 1,
					sourceType: ['album'],
					success(res) {
						that.imageSrc = res.tempFilePaths[0]
						that.startRecognize()
					}
				})
			},
			retake() {
				this.imageSrc = ''
				this.isThinking = false
				this.hasNavigated = false
			},
			startRecognize() {
				if (this.isThinking || this.hasNavigated) return
				this.isThinking = true
				// 模拟AI识别过程，1.5秒后自动跳转
				setTimeout(() => {
					this.isThinking = false
					this.hasNavigated = true
					uni.navigateTo({
						url: `/pages/food-result/food-result?imageUrl=${encodeURIComponent(this.imageSrc)}`,
						success: () => {
							this.hasNavigated = true
						},
						fail: () => {
							this.hasNavigated = false
						}
					})
				}, 1500)
			}
		}
	}
</script>

<style lang="scss" scoped>
	.camera-page {
		min-height: 100vh;
		background-color: #000000;
		display: flex;
		flex-direction: column;
	}

	/* 导航栏 */
	.nav-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px 16px;
	}

	.nav-back {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background-color: rgba(255, 255, 255, 0.15);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.back-icon {
		color: #FFFFFF;
		font-size: 24px;
		line-height: 1;
	}

	.nav-actions {
		display: flex;
		gap: 12px;
		align-items: center;
	}

	.nav-action-btn {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background-color: rgba(255, 255, 255, 0.15);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.action-icon {
		color: #FFFFFF;
		font-size: 16px;
	}

	/* 相机区域 */
	.camera-area {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px;
		position: relative;
	}

	.camera-placeholder {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 400rpx;
		border: 2px dashed rgba(255, 255, 255, 0.2);
		border-radius: 24px;
	}

	.camera-hint {
		color: rgba(255, 255, 255, 0.5);
		font-size: 14px;
	}

	.image-preview-wrap {
		width: 100%;
		height: 100%;
		position: relative;
		border-radius: 16px;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.preview-img {
		width: 100%;
		height: 600rpx;
		border-radius: 16px;
	}

	.thinking-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.55);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		border-radius: 16px;
	}

	.thinking-text {
		color: #FF9500;
		font-size: 18px;
		font-weight: 500;
		animation: thinkingPulse 1.5s ease-in-out infinite;
	}

	@keyframes thinkingPulse {
		0%, 100% {
			opacity: 0.4;
		}
		50% {
			opacity: 1;
		}
	}

	/* 底部操作区 */
	.bottom-area {
		padding: 20px 40px 40px;
	}

	.bottom-controls {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.spacer {
		width: 48px;
	}

	.album-btn {
		width: 48px;
		height: 48px;
		border-radius: 12px;
		background-color: rgba(255, 255, 255, 0.15);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.album-icon {
		font-size: 20px;
		color: #FFFFFF;
	}

	.shutter-btn {
		width: 72px;
		height: 72px;
		border-radius: 50%;
		border: 4px solid #FFFFFF;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 4px;
	}

	.shutter-inner {
		width: 56px;
		height: 56px;
		border-radius: 50%;
		background-color: #FFFFFF;
	}

	.shutter-btn:active {
		transform: scale(0.92);
	}

	.retake-btn {
		margin: 0 auto;
		padding: 12px 32px;
		border-radius: 24px;
		background-color: rgba(255, 255, 255, 0.15);
	}

	.retake-label {
		color: #FFFFFF;
		font-size: 16px;
		font-weight: 500;
	}
</style>
