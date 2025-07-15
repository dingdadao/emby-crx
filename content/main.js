class Home {
	static start() {
		this.cache = {
			items: undefined,
			item: new Map(),
		};
		this.itemQuery = { ImageTypes: "Backdrop", EnableImageTypes: "Logo,Backdrop", IncludeItemTypes: "Movie,Series", SortBy: "ProductionYear, PremiereDate, SortName", Recursive: true, ImageTypeLimit: 1, Limit: 10, Fields: "ProductionYear", SortOrder: "Descending", EnableUserData: false, EnableTotalRecordCount: false };
		this.coverOptions = { type: "Backdrop", maxWidth: 3000 };
		this.logoOptions = { type: "Logo", maxWidth: 3000 };
		this.initStart = false;
		setInterval(() => {
			if (window.location.href.indexOf("!/home") != -1) {
				if ($(".view:not(.hide) .misty-banner").length == 0 && $(".misty-loading").length == 0) {
					this.initStart = false;
					this.initLoading();
				}
				if ($(".hide .misty-banner").length != 0) {
					$(".hide .misty-banner").remove();
				}
				if (!this.initStart && $(".section0 .card").length != 0 && $(".view:not(.hide) .misty-banner").length == 0) {
					this.initStart = true;
					this.init();
				}
			}
		}, 233);
	}

	static async init() {
		// Beta
		$(".view:not(.hide)").attr("data-type", "home");
		// Loading
		const serverName = await this.injectCall("serverName", "");
		$(".misty-loading h1").text(serverName).addClass("active");
		// Banner
		await this.initBanner();
		this.initEvent();
	}

	/* 插入Loading */
	static initLoading() {
		const load = `
		<div class="misty-loading">
			<h1></h1>
			<div class="mdl-spinner"><div class="mdl-spinner__layer mdl-spinner__layer-1"><div class="mdl-spinner__circle-clipper mdl-spinner__left"><div class="mdl-spinner__circle mdl-spinner__circleLeft"></div></div><div class="mdl-spinner__circle-clipper mdl-spinner__right"><div class="mdl-spinner__circle mdl-spinner__circleRight"></div></div></div></div>
		</div>
		`;
		$("body").append(load);
	}

	static injectCode(code) {
		let hash = md5(code + Math.random().toString());
		return new Promise((resolve, reject) => {
			if ("BroadcastChannel" in window) {
				const channel = new BroadcastChannel(hash);
				channel.addEventListener("message", (event) => resolve(event.data));
			} else if ("postMessage" in window) {
				window.addEventListener("message", (event) => {
					if (event.data.channel === hash) {
						resolve(event.data.message);
					}
				});
			}
			const script = `
			<script class="I${hash}">
				setTimeout(async ()=> {
					async function R${hash}(){${code}};
					if ("BroadcastChannel" in window) {
						const channel = new BroadcastChannel("${hash}");
						channel.postMessage(await R${hash}());
					} else if ('postMessage' in window) {
						window.parent.postMessage({channel:"${hash}",message:await R${hash}()}, "*");
					}
					document.querySelector("script.I${hash}").remove()
				}, 16)
			</script>
			`;
			$(document.head || document.documentElement).append(script);
		});
	}

	static injectCall(func, arg) {
		const script = `
		// const client = (await window.require(["ApiClient"]))[0];
		const client = await new Promise((resolve, reject) => {
			setInterval(() => {
				if (window.ApiClient != undefined) resolve(window.ApiClient);
			}, 16);
		});
		return await client.${func}(${arg})
		`;
		return this.injectCode(script);
	}

	static getItems(query) {
		if (this.cache.items == undefined) {
			this.cache.items = this.injectCall("getItems", "client.getCurrentUserId(), " + JSON.stringify(query));
		}
		return this.cache.items;
	}

	static async getItem(itemId) {
		// 双缓存 优先使用 WebStorage
		if (typeof Storage !== "undefined" && !localStorage.getItem("CACHE|" + itemId) && !this.cache.item.has(itemId)) {
			const data = JSON.stringify(await this.injectCall("getItem", `client.getCurrentUserId(), "${itemId}"`));
			if (typeof Storage !== "undefined") localStorage.setItem("CACHE|" + itemId, data);
			else this.cache.item.set(itemId, data);
		}
		return JSON.parse(typeof Storage !== "undefined" ? localStorage.getItem("CACHE|" + itemId) : this.cache.item.get(itemId));
	}

	static getImageUrl(itemId, options) {
		return this.injectCall("getImageUrl", itemId + ", " + JSON.stringify(options));
	}

	/* 插入Banner */
	static async initBanner() {
		const banner = `
		<div class="misty-banner">
			<div class="misty-banner-body">
			</div>
			<div class="misty-banner-library">
				<div class="misty-banner-logos"></div>
			</div>
		</div>
		`;
		$(".view:not(.hide) .homeSectionsContainer").prepend(banner);

		// 插入数据
		const data = await this.getItems(this.itemQuery);
		console.log(data);
		if (!data.Items || data.Items.length === 0) {
			$(".misty-loading").fadeOut(500, () => $(".misty-loading").remove());
			$(".misty-banner-body").append('<div class="misty-banner-empty">\n  <div class="misty-banner-empty-inner">\n    <span>暂无媒体内容，请前往媒体库添加影片或剧集</span>\n  </div>\n</div>');
			return;
		}

		const preloadImages = [];
		for (let i = 0; i < data.Items.length; i++) {
			const item = data.Items[i];
			const detail = await this.getItem(item.Id);
			const imgUrl = await this.getImageUrl(detail.Id, this.coverOptions);
			const logoUrl = await this.getImageUrl(detail.Id, this.logoOptions);
			const overview = detail.Overview ? detail.Overview : "暂无简介";
			const itemHtml = `
			<div class="misty-banner-item" id="${detail.Id}">
				<div class="misty-banner-imgwrap">
					<img draggable="false" loading="eager" decoding="async" class="misty-banner-cover" data-id="${detail.Id}" src="${imgUrl}" alt="Backdrop" style="">
				</div>
				<div class="misty-banner-info padded-left padded-right">
					<div><p class="misty-banner-overview">${overview}</p></div>
				</div>
			</div>
			`;
			const logoHtml = `
			<img id="${detail.Id}" draggable="false" loading="auto" decoding="lazy" class="misty-banner-logo" data-banner="img-title" alt="Logo" src="${logoUrl}">
			`;
			if (detail.ImageTags && detail.ImageTags.Logo) {
				$(".misty-banner-logos").append(logoHtml);
			}
			$(".misty-banner-body").append(itemHtml);
			if (i > 0) preloadImages.push(imgUrl);
		}

		// 立即移除 loading（只等数据，不等图片）
		$(".misty-loading").fadeOut(500, () => $(".misty-loading").remove());

		// 移除骨架屏相关事件，图片加载失败兜底保留
		$(".misty-banner-cover").on("error", function() {
			$(this).attr("src", "static/img/icon.png");
		});

		// 预加载后续图片，提升切换体验
		preloadImages.forEach(url => {
			const img = new window.Image();
			img.src = url;
		});

		// 绑定图片点击事件，跳转到详情页
		$(document).off("click", ".misty-banner-cover").on("click", ".misty-banner-cover", function(e) {
			e.stopPropagation();
			const id = $(this).data("id");
			if (window.appRouter && typeof window.appRouter.showItem === "function") {
				window.appRouter.showItem(id);
			} else {
				window.location.href = `/web/index.html#!/item?id=${id}`;
			}
		});

		// section0 相关逻辑和轮播动画保持不变
		await new Promise((resolve, reject) => {
			let waitsection0 = setInterval(() => {
				if ($(".view:not(.hide) .section0 .emby-scrollbuttons").length > 0 && $(".view:not(.hide) .section0.hide").length == 0) {
					clearInterval(waitsection0);
					resolve();
				}
			}, 16);
		});

		$(".view:not(.hide) .section0 .emby-scrollbuttons").remove();
		const items = $(".view:not(.hide) .section0 .emby-scroller .itemsContainer")[0].items;
		if (CommonUtils.checkType() === 'pc') {
			$(".view:not(.hide) .section0").detach().appendTo(".view:not(.hide) .misty-banner-library");
		}

		await CommonUtils.sleep(150);
		$(".view:not(.hide) .section0 .emby-scroller .itemsContainer")[0].items = items;

		// 置入场动画
		let delay = 80; // 动媒体库画间隔
		let id = $(".misty-banner-item").eq(0).addClass("active").attr("id"); // 初次信息动画
		$(`.misty-banner-logo[id=${id}]`).addClass("active");

		await CommonUtils.sleep(200); // 间隔动画
		$(".section0 > div").addClass("misty-banner-library-overflow"); // 关闭overflow 防止媒体库动画溢出
		$(".misty-banner .card").each((i, dom) => setTimeout(() => $(dom).addClass("misty-banner-library-show"), i * delay)); // 媒体库动画
		await CommonUtils.sleep(delay * 8 + 1000); // 等待媒体库动画完毕
		$(".section0 > div").removeClass("misty-banner-library-overflow"); // 开启overflow 防止无法滚动

		// 滚屏逻辑
		var index = 0;
		clearInterval(this.bannerInterval);
		this.bannerInterval = setInterval(() => {
			// 背景切换
			if (window.location.href.endsWith("home") && !document.hidden) {
				index += index + 1 == $(".misty-banner-item").length ? -index : 1;
				$(".misty-banner-body").css("left", -(index * 100).toString() + "%");
				// 信息切换
				$(".misty-banner-item.active").removeClass("active");
				let id = $(".misty-banner-item").eq(index).addClass("active").attr("id");
				// LOGO切换
				$(".misty-banner-logo.active").removeClass("active");
				$(`.misty-banner-logo[id=${id}]`).addClass("active");
			}
		}, 8000);
	}

	/* 初始事件 */
	static initEvent() {
		// 通过注入方式, 方可调用appRouter函数, 以解决Content-Script window对象不同步问题
		const script = `
		// 挂载appRouter
		if (!window.appRouter) window.appRouter = (await window.require(["appRouter"]))[0];
		/* // 修复library事件参数
		const serverId = ApiClient._serverInfo.Id,
			librarys = document.querySelectorAll(".view:not(.hide) .section0 .card");
		librarys.forEach(library => {
			library.setAttribute("data-serverid", serverId);
			library.setAttribute("data-type", "CollectionFolder");
		}); */
		`;
		this.injectCode(script);
	}
}

// 运行
if ("BroadcastChannel" in window || "postMessage" in window) {
	if ($("meta[name=application-name]").attr("content") == "Emby" || $(".accent-emby") != undefined) {
		Home.start();
	}
}
