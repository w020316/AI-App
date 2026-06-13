<template>
	<view class="tab-bar">
		<view class="tab-bar-inner">
			<!-- 饮食记录 -->
			<view class="tab-item" @tap="switchTab('home')">
				<view class="tab-icon-wrap" :class="{ active: current === 'home' }">
					<view class="hamburger-icon">
						<view class="hamburger-line"></view>
						<view class="hamburger-line"></view>
						<view class="hamburger-line"></view>
					</view>
				</view>
				<text class="tab-label" :class="{ active: current === 'home' }">饮食记录</text>
			</view>

			<!-- 设置 -->
			<view class="tab-item" @tap="switchTab('settings')">
				<view class="tab-icon-wrap" :class="{ active: current === 'settings' }">
					<view class="settings-icon">
						<view class="settings-cog"></view>
					</view>
				</view>
				<text class="tab-label" :class="{ active: current === 'settings' }">设置</text>
			</view>

			<!-- 相机 - 中间突出按钮 -->
			<view class="tab-item tab-camera" @tap="openCamera">
				<view class="camera-btn">
					<view class="camera-icon">
						<view class="camera-body"></view>
						<view class="camera-lens"></view>
					</view>
				</view>
			</view>

			<!-- 饮水 -->
			<view class="tab-item" @tap="switchTab('water')">
				<view class="tab-icon-wrap" :class="{ active: current === 'water' }">
					<view class="water-icon">
						<view class="water-cup"></view>
					</view>
				</view>
				<text class="tab-label" :class="{ active: current === 'water' }">饮水</text>
			</view>

			<!-- LiveLog -->
			<view class="tab-item" @tap="goToLiveLog">
				<view class="tab-icon-wrap" :class="{ active: current === 'livelog' }">
					<view class="livelog-icon">
						<view class="livelog-square"></view>
					</view>
				</view>
				<text class="tab-label" :class="{ active: current === 'livelog' }">LiveLog</text>
			</view>
		</view>
		<!-- safe-area-bottom 占位 -->
		<view class="safe-area-bottom"></view>
	</view>
</template>

<script>
	export default {
		name: 'TabBar',
		props: {
			current: {
				type: String,
				default: 'home'
			}
		},
		methods: {
			switchTab(name) {
				const routes = {
					home: '/pages/home/home',
					settings: '/pages/settings/settings',
					water: '/pages/water/water'
				}
				if (name === this.current) return
				if (routes[name]) {
					uni.switchTab({ url: routes[name] })
				}
			},
			openCamera() {
				uni.navigateTo({ url: '/pages/food-camera/food-camera' })
			},
			goToLiveLog() {
				uni.navigateTo({ url: '/pages/livelog/livelog' })
			}
		}
	}
</script>

<style lang="scss" scoped>
	.tab-bar {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 999;
		background-color: #FFFFFF;
		border-radius: 24px 24px 0 0;
		box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.06);
	}

	.tab-bar-inner {
		display: flex;
		justify-content: space-around;
		align-items: center;
		height: 80px;
		padding-bottom: 12px;
	}

	.safe-area-bottom {
		height: constant(safe-area-inset-bottom);
		height: env(safe-area-inset-bottom);
	}

	.tab-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		flex: 1;
	}

	.tab-icon-wrap {
		width: 48px;
		height: 48px;
		border-radius: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: transparent;
		transition: all 0.3s ease;
	}

	.tab-icon-wrap.active {
		background-color: #E8F5E9;
	}

	/* 汉堡菜单图标 */
	.hamburger-icon {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 3px;
		width: 20px;
		height: 20px;
	}

	.hamburger-line {
		width: 16px;
		height: 2px;
		background-color: #8E8E93;
		border-radius: 1px;
	}

	.tab-icon-wrap.active .hamburger-line {
		background-color: #8BC34A;
	}

	/* 设置图标 */
	.settings-icon {
		width: 20px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.settings-cog {
		width: 18px;
		height: 18px;
		border: 2px solid #8E8E93;
		border-radius: 50%;
		position: relative;
	}

	.settings-cog::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 6px;
		height: 6px;
		background-color: #8E8E93;
		border-radius: 50%;
	}

	/* 水杯图标 */
	.water-icon {
		width: 20px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.water-cup {
		width: 14px;
		height: 16px;
		border: 2px solid #8E8E93;
		border-radius: 0 0 4px 4px;
		border-top: none;
		position: relative;
	}

	.water-cup::before {
		content: '';
		position: absolute;
		top: 2px;
		right: -5px;
		width: 4px;
		height: 6px;
		border: 2px solid #8E8E93;
		border-left: none;
		border-radius: 0 3px 3px 0;
	}

	/* LiveLog 图标 */
	.livelog-icon {
		width: 20px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.livelog-square {
		width: 16px;
		height: 16px;
		background-color: #8E8E93;
		border-radius: 4px;
	}

	.tab-label {
		font-size: 10px;
		color: #8E8E93;
		margin-top: 4px;
		transition: color 0.3s ease;
	}

	.tab-label.active {
		color: #8BC34A;
	}

	/* 相机按钮 - 中间突出设计 */
	.tab-camera {
		position: relative;
		top: -12px;
	}

	.camera-btn {
		width: 56px;
		height: 56px;
		border-radius: 50%;
		background-color: #FFFFFF;
		border: 4px solid #F9F9F9;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
		transition: transform 0.2s ease;
	}

	.camera-btn:active {
		transform: scale(0.92);
	}

	/* 相机图标 */
	.camera-icon {
		width: 24px;
		height: 20px;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.camera-body {
		width: 22px;
		height: 16px;
		background-color: #1C1C1E;
		border-radius: 2px;
		position: relative;
	}

	.camera-body::before {
		content: '';
		position: absolute;
		top: -3px;
		left: 50%;
		transform: translateX(-50%);
		width: 8px;
		height: 3px;
		background-color: #1C1C1E;
		border-radius: 1px 1px 0 0;
	}

	.camera-lens {
		position: absolute;
		width: 8px;
		height: 8px;
		background-color: #FFFFFF;
		border-radius: 50%;
		border: 2px solid #1C1C1E;
	}
</style>
