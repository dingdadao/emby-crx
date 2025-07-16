window.safeShowItem = function(id, serverId) {
    function doJump() {
        if (window.appRouter && typeof window.appRouter.showItem === 'function') {
            window.appRouter.showItem(id, serverId);
        } else {
            window.location.hash = '!/item?id=' + id + '&serverId=' + serverId;
        }
    }
    if (window.ApiClient && window.ApiClient.getItem) {
        doJump();
    } else {
        let waited = 0;
        const timer = setInterval(() => {
            if (window.ApiClient && window.ApiClient.getItem) {
                clearInterval(timer);
                doJump();
            } else if ((waited += 100) > 2000) {
                clearInterval(timer);
                doJump();
            }
        }, 100);
    }
};

class Home {
	static start() {
		this.cache = {
			items: undefined,
			item: new Map(),
		};
		// 基础查询参数
		this.itemQuery = { 
			ImageTypes: "Backdrop", 
			EnableImageTypes: "Logo,Backdrop", 
			IncludeItemTypes: "Movie,Series", 
			SortBy: "ProductionYear, PremiereDate, SortName", 
			Recursive: true, 
			ImageTypeLimit: 1, 
			Limit: 10, 
			Fields: "ProductionYear", 
			SortOrder: "Descending", 
			EnableUserData: false, 
			EnableTotalRecordCount: false 
		};
		
		// 检测URL参数中的媒体库ID
		const urlParams = new URLSearchParams(window.location.search);
		const libraryId = urlParams.get('libraryId');
		const libraryName = urlParams.get('libraryName');
		
		// 支持多个媒体库ID（用逗号分隔）
		const libraryIds = urlParams.get('libraryIds');
		const mixMode = urlParams.get('mix') === 'true'; // 混合模式
		
		if (libraryIds) {
			const idArray = libraryIds.split(',').map(id => id.trim()).filter(id => id);
			if (idArray.length > 0) {
				if (mixMode) {
					// 混合模式：从多个媒体库中混合获取内容
					this.multipleLibraries = idArray;
					console.log(`混合模式：从${idArray.length}个媒体库中混合获取内容`);
				} else {
					// 随机模式：从多个媒体库中随机选择一个
					const randomId = idArray[Math.floor(Math.random() * idArray.length)];
					this.itemQuery.ParentId = randomId;
					console.log(`从多个媒体库中随机选择: ${randomId} (总共${idArray.length}个)`);
				}
			}
		} else if (libraryId) {
			this.itemQuery.ParentId = libraryId;
			console.log(`指定媒体库ID: ${libraryId}`);
		} else if (libraryName) {
			this.itemQuery.NameStartsWithOrGreater = libraryName;
			console.log(`指定媒体库名称: ${libraryName}`);
		}
		
		// 可选：指定多个媒体库ID（取消注释并填入你的媒体库ID，用逗号分隔）
		const multipleLibraryIds = ["5015", "5", "15292"];
		
		// 选择模式：true=混合模式，false=随机选择模式
		const useMixMode = true;
		
		if (useMixMode) {
			// 混合模式：从多个媒体库中混合获取内容
			this.multipleLibraries = multipleLibraryIds;
			console.log(`混合模式：从${multipleLibraryIds.length}个媒体库中混合获取内容`);
		} else {
			// 随机模式：从多个媒体库中随机选择一个
			const randomId = multipleLibraryIds[Math.floor(Math.random() * multipleLibraryIds.length)];
			this.itemQuery.ParentId = randomId;
			console.log(`从多个媒体库中随机选择: ${randomId} (总共${multipleLibraryIds.length}个)`);
		}
		
		// 可选：指定特定媒体库ID（取消注释并填入你的媒体库ID）
		// this.itemQuery.ParentId = "你的媒体库ID";
		
		// 可选：指定媒体库名称（取消注释并填入你的媒体库名称）
		// this.itemQuery.NameStartsWithOrGreater = "你的媒体库名称";
		
		// 调试：自动输出所有媒体库信息（取消注释启用）
		// this.logAllLibraries();
		
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

	// 获取媒体库列表
	static getLibraries() {
		return this.injectCall("getLibraries", "client.getCurrentUserId()");
	}

	// 获取特定媒体库信息
	static getLibraryInfo(libraryId) {
		return this.injectCall("getLibraryInfo", `client.getCurrentUserId(), "${libraryId}"`);
	}

	// 获取所有媒体库信息并输出到控制台
	static async logAllLibraries() {
		try {
			const libraries = await this.getLibraries();
			console.log("所有媒体库信息:", libraries);
			
			if (libraries && libraries.length > 0) {
				console.log("媒体库列表:");
				libraries.forEach((lib, index) => {
					console.log(`${index + 1}. ID: ${lib.Id}, 名称: ${lib.Name}, 类型: ${lib.CollectionType}`);
				});
			}
		} catch (error) {
			console.log("获取媒体库列表失败:", error);
		}
	}

	// 从多个媒体库中混合获取内容
	static async getItemsFromMultipleLibraries(libraryIds, limitPerLibrary = 5) {
		const allItems = [];
		
		for (const libraryId of libraryIds) {
			try {
				const query = { ...this.itemQuery, ParentId: libraryId, Limit: limitPerLibrary };
				const data = await this.injectCall("getItems", "client.getCurrentUserId(), " + JSON.stringify(query));
				if (data.Items && data.Items.length > 0) {
					allItems.push(...data.Items);
				}
			} catch (error) {
				console.log(`获取媒体库 ${libraryId} 失败:`, error);
			}
		}
		
		// 随机打乱顺序
		for (let i = allItems.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[allItems[i], allItems[j]] = [allItems[j], allItems[i]];
		}
		
		// 限制总数
		return { Items: allItems.slice(0, this.itemQuery.Limit) };
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

	// 安全的跳转到详情页方法
	static async safeNavigateToItem(itemId) {
		try {
			console.log("开始跳转到详情页，ID:", itemId);
			
			// 优先使用Emby内置路由
			await this.navigateWithEmbyRouter(itemId);
			
		} catch (error) {
			console.log("Emby路由跳转失败，使用备用方案:", error);
			this.navigateToItemDirect(itemId);
		}
	}

	// 直接跳转到详情页的方法
	static navigateToItemDirect(itemId) {
		try {
			// 方式1：直接修改hash
			console.log("方式1：修改hash");
			window.location.hash = `!/item?id=${itemId}`;
			
			// 方式2：如果hash修改失败，使用完整URL
			setTimeout(() => {
				if (window.location.hash !== `#!/item?id=${itemId}`) {
					console.log("方式2：使用完整URL");
					const currentUrl = window.location.href;
					const baseUrl = currentUrl.split('#!/')[0];
					window.location.href = `${baseUrl}#!/item?id=${itemId}`;
				}
			}, 100);
			
			// 方式3：如果还是失败，强制刷新页面
			setTimeout(() => {
				if (window.location.hash !== `#!/item?id=${itemId}`) {
					console.log("方式3：强制刷新页面");
					const currentUrl = window.location.href;
					const baseUrl = currentUrl.split('#!/')[0];
					window.location.replace(`${baseUrl}#!/item?id=${itemId}`);
				}
			}, 500);
			
		} catch (error) {
			console.log("所有跳转方式都失败:", error);
		}
	}

	// 使用Emby内置路由跳转
	static async navigateWithEmbyRouter(itemId) {
		const script = `
		try {
			// 尝试使用appRouter
			if (window.appRouter && typeof window.appRouter.showItem === "function") {
				window.appRouter.showItem("${itemId}");
				return "使用appRouter跳转";
			}
			
			// 尝试使用page.js
			if (window.page && typeof window.page.show === "function") {
				window.page.show("/item?id=${itemId}");
				return "使用page.js跳转";
			}
			
			// 尝试使用history API
			const currentUrl = window.location.href;
			const baseUrl = currentUrl.split('#!/')[0];
			const newUrl = baseUrl + "#!/item?id=${itemId}";
			window.history.pushState({}, '', newUrl);
			window.dispatchEvent(new PopStateEvent('popstate'));
			return "使用history API跳转";
			
		} catch (error) {
			// 最后的备用方案
			window.location.hash = "!/item?id=${itemId}";
			return "使用hash跳转";
		}
		`;
		
		try {
			const result = await this.injectCode(script);
			console.log("跳转结果:", result);
		} catch (error) {
			console.log("注入跳转失败，使用备用方案:", error);
			this.navigateToItemDirect(itemId);
		}
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
		let data;
		if (this.multipleLibraries) {
			// 混合模式：从多个媒体库中混合获取
			data = await this.getItemsFromMultipleLibraries(this.multipleLibraries, Math.ceil(this.itemQuery.Limit / this.multipleLibraries.length));
		} else {
			// 单媒体库模式
			data = await this.getItems(this.itemQuery);
		}
		console.log("海报墙数据:", data);
		
		// 输出当前媒体库信息
		if (this.itemQuery.ParentId) {
			try {
				const libraryInfo = await this.getLibraryInfo(this.itemQuery.ParentId);
				console.log("当前媒体库信息:", libraryInfo);
			} catch (error) {
				console.log("获取媒体库信息失败:", error);
			}
		}
		
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
			<div class="misty-banner-item" id="${detail.Id}" data-serverid="${detail.ServerId}">
				<div class="misty-banner-imgwrap">
					<img draggable="false" loading="eager" decoding="async" class="misty-banner-cover" data-id="${detail.Id}" data-serverid="${detail.ServerId}" src="${imgUrl}" alt="Backdrop" style="">
				</div>
				<div class="misty-banner-info padded-left padded-right">
					<h1>${detail.Name}</h1>
					<div><p>${overview}</p></div>
					<div><button onclick="safeShowItem('${detail.Id}','${detail.ServerId}')">MORE</button></div>
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

		// 绑定图片点击事件，跳转到详情页（作为MORE按钮的备用）
		$(document).off("click.mistyBanner").on("click.mistyBanner", ".misty-banner-cover", function(e) {
			e.preventDefault();
			e.stopPropagation();
			const id = $(this).data("id");
			const serverId = $(this).data("serverid");
			console.log("点击图片，ID:", id);
			if (id) {
				window.safeShowItem(id, serverId);
			}
		});

		// 绑定整个海报项的点击事件（作为备用）
		$(document).off("click.mistyBannerItem").on("click.mistyBannerItem", ".misty-banner-item", function(e) {
			// 如果点击的是按钮，不处理（让按钮自己的onclick处理）
			if ($(e.target).is('button')) {
				return;
			}
			e.preventDefault();
			e.stopPropagation();
			const id = $(this).attr("id");
			const serverId = $(this).data("serverid");
			console.log("点击海报项，ID:", id);
			if (id) {
				window.safeShowItem(id, serverId);
			}
		});

		// 添加鼠标样式，提示可点击
		$(".misty-banner-item").css("cursor", "pointer");
		$(".misty-banner-imgwrap").css("cursor", "pointer");
		$(".misty-banner-cover").css("cursor", "pointer");

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
		// 注入safeShowItem
		window.safeShowItem = function(id, serverId) {
			function doJump() {
				if (window.appRouter && typeof window.appRouter.showItem === 'function') {
					window.appRouter.showItem(id, serverId);
				} else {
					window.location.hash = '!/item?id=' + id + '&serverId=' + serverId;
				}
			}
			if (window.ApiClient && window.ApiClient.getItem) {
				doJump();
			} else {
				let waited = 0;
				const timer = setInterval(() => {
					if (window.ApiClient && window.ApiClient.getItem) {
						clearInterval(timer);
						doJump();
					} else if ((waited += 100) > 2000) {
						clearInterval(timer);
						doJump();
					}
				}, 100);
			}
		};
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
