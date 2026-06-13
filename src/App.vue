<script>
	export default {
		onLaunch: function() {
			console.log('App Launch')
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style lang="scss">
	/* 全局公共样式 */
	page {
		font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', sans-serif;
		color: #1C1C1E;
		font-size: 16px;
		line-height: 1.5;
	}

	/* 安全区域 */
	.safe-area-bottom {
		padding-bottom: constant(safe-area-inset-bottom);
		padding-bottom: env(safe-area-inset-bottom);
	}

	/* 动画 - 卡路里数字弹性弹出 */
	.calorie-pop {
		animation: caloriePop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
	}
	@keyframes caloriePop {
		from { transform: translateY(16px) scale(0.92); opacity: 0; }
		to { transform: translateY(0) scale(1); opacity: 1; }
	}

	/* 动画 - 底部滑入 */
	.slide-up-enter-active {
		animation: slideUp 0.4s cubic-bezier(0.32, 0.72, 0, 1) forwards;
	}
	@keyframes slideUp {
		from { transform: translateY(100%); opacity: 0; }
		to { transform: translateY(0); opacity: 1; }
	}

	/* 动画 - 弹性弹出 */
	.pop-in {
		animation: popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
	}
	@keyframes popIn {
		from { transform: scale(0.5); opacity: 0; }
		to { transform: scale(1); opacity: 1; }
	}

	/* 动画 - AI思考闪烁 */
	.shimmer {
		animation: shimmer 1.5s ease-in-out infinite;
	}
	@keyframes shimmer {
		0%, 100% { opacity: 0.4; }
		50% { opacity: 1; }
	}

	/* 动画 - 淡入 */
	.fade-in {
		animation: fadeIn 0.3s ease forwards;
	}
	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	/* 动画 - 从左滑入 */
	.slide-left-enter {
		animation: slideLeft 0.3s ease forwards;
	}
	@keyframes slideLeft {
		from { transform: translateX(-100%); opacity: 0; }
		to { transform: translateX(0); opacity: 1; }
	}

	/* 动画 - 从右滑入 */
	.slide-right-enter {
		animation: slideRight 0.3s ease forwards;
	}
	@keyframes slideRight {
		from { transform: translateX(100%); opacity: 0; }
		to { transform: translateX(0); opacity: 1; }
	}

	/* 动画 - 缩放淡入 */
	.scale-fade-in {
		animation: scaleFadeIn 0.25s ease forwards;
	}
	@keyframes scaleFadeIn {
		from { transform: scale(0.8); opacity: 0; }
		to { transform: scale(1); opacity: 1; }
	}

	/* 通用文字颜色 */
	.text-primary { color: #8BC34A; }
	.text-accent { color: #FF6B35; }
	.text-secondary { color: #8E8E93; }
	.text-white { color: #FFFFFF; }
	.text-dark { color: #1C1C1E; }
	.text-time { color: #8BC34A; }
	.text-bold { font-weight: 600; }
	.text-italic { font-style: italic; }
	.text-center { text-align: center; }

	/* 通用背景色 */
	.bg-page { background-color: #F9F9F9; }
	.bg-white { background-color: #FFFFFF; }
	.bg-dark { background-color: #000000; }
	.bg-primary { background-color: #8BC34A; }
	.bg-accent { background-color: #FF6B35; }
	.bg-secondary { background-color: #F2F2F7; }

	/* 通用圆角 */
	.rounded-sm { border-radius: 8px; }
	.rounded-md { border-radius: 16px; }
	.rounded-lg { border-radius: 24px; }
	.rounded-xl { border-radius: 32px; }
	.rounded-full { border-radius: 9999px; }

	/* 通用间距 */
	.p-sm { padding: 8px; }
	.p-md { padding: 12px; }
	.p-lg { padding: 16px; }
	.p-xl { padding: 24px; }
	.m-sm { margin: 8px; }
	.m-md { margin: 12px; }
	.m-lg { margin: 16px; }

	/* 通用flex */
	.flex { display: flex; }
	.flex-col { display: flex; flex-direction: column; }
	.flex-center { display: flex; align-items: center; justify-content: center; }
	.flex-between { display: flex; align-items: center; justify-content: space-between; }
	.flex-1 { flex: 1; }
	.flex-wrap { flex-wrap: wrap; }
	.gap-sm { gap: 8px; }
	.gap-md { gap: 12px; }
	.gap-lg { gap: 16px; }

	/* 通用阴影 */
	.shadow-sm { box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); }
	.shadow-md { box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12); }
	.shadow-lg { box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15); }

	/* 通用溢出 */
	.ellipsis {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.ellipsis-2 {
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
	}
</style>
