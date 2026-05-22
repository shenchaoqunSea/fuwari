<script lang="ts">
import { onMount } from "svelte";

// 表单状态
let postType = "wechat"; // 'wechat' | 'normal'
let title = "";
let content = "";
let tags = "";
let isPublishing = false;
let publishResult = "";

// 图片相关
let selectedFiles: File[] = [];
let imagePreviews: string[] = [];
let isUploadingImages = false;
let showImagePicker = false;

// GitHub 配置
let githubToken = "";
let githubRepo = "shenchaoqunSea/fuwari";

onMount(() => {
	githubToken = localStorage.getItem("github_token") || "";
});

// 处理图片选择（相册）
function handleGallerySelect(event: Event) {
	const input = event.target as HTMLInputElement;
	handleFiles(input.files);
	input.value = "";
}

// 处理拍照
function handleCameraCapture(event: Event) {
	const input = event.target as HTMLInputElement;
	handleFiles(input.files);
	input.value = "";
}

// 处理文件列表
function handleFiles(files: FileList | null) {
	if (!files) return;

	const fileList = Array.from(files);
	selectedFiles = [...selectedFiles, ...fileList];

	fileList.forEach((file) => {
		if (!file.type.startsWith("image/")) {
			alert(`${file.name} 不是图片文件`);
			return;
		}

		if (file.size > 5 * 1024 * 1024) {
			alert(`${file.name} 超过 5MB，请压缩后重试`);
			return;
		}

		const reader = new FileReader();
		reader.onload = (e) => {
			imagePreviews.push(e.target?.result as string);
			imagePreviews = [...imagePreviews];
		};
		reader.readAsDataURL(file);
	});
}

// 删除图片
function removeImage(index: number) {
	selectedFiles.splice(index, 1);
	imagePreviews.splice(index, 1);
	selectedFiles = [...selectedFiles];
	imagePreviews = [...imagePreviews];
}

// 将文件转换为 base64
function fileToBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const base64 = (reader.result as string).split(",")[1];
			resolve(base64);
		};
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
}

// 使用简单的文件上传方式（更稳定）
async function uploadFileToGitHub(
	path: string,
	content: string,
	message: string,
): Promise<void> {
	const response = await fetch(
		`https://api.github.com/repos/${githubRepo}/contents/${path}`,
		{
			method: "PUT",
			headers: {
				Authorization: `Bearer ${githubToken}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				message,
				content,
			}),
		},
	);

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.message || `Failed to upload ${path}`);
	}
}

async function publishPost() {
	if (!title.trim()) {
		alert("请输入文章标题");
		return;
	}
	if (!content.trim()) {
		alert("请输入文章内容");
		return;
	}
	if (!githubToken) {
		alert("请先配置 GitHub Token");
		showTokenModal();
		return;
	}

	isPublishing = true;
	publishResult = "";

	try {
		const date = new Date();
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		const hours = String(date.getHours()).padStart(2, "0");
		const minutes = String(date.getMinutes()).padStart(2, "0");
		const seconds = String(date.getSeconds()).padStart(2, "0");
		const dateStr = `${year}-${month}-${day}-${hours}${minutes}${seconds}`;
		const publishedDate = `${year}-${month}-${day}`;

		// 构建文件路径
		let filePath: string;
		let imagesPath: string;

		if (postType === "wechat") {
			filePath = `src/content/posts/wechat_moments/${dateStr}/${title}.md`;
			imagesPath = `src/content/posts/wechat_moments/${dateStr}/images/`;
		} else {
			filePath = `src/content/posts/${title}.md`;
			imagesPath = `src/content/posts/${title}/images/`;
		}

		// 更新内容中的图片路径
		let finalContent = content;
		if (selectedFiles.length > 0) {
			const hasImages = content.includes("![");
			if (!hasImages && selectedFiles.length === 1) {
				finalContent = `${content}\n\n![](./images/${selectedFiles[0].name})`;
			} else if (!hasImages && selectedFiles.length > 1) {
				finalContent =
					content +
					"\n\n" +
					selectedFiles.map((f) => `![](./images/${f.name})`).join("\n");
			}
		}

		// 构建 Markdown
		const frontmatter = `---
title: "${title}"
published: ${publishedDate}
description: ''
image: ${selectedFiles.length > 0 ? `'./images/${selectedFiles[0].name}'` : "''"}
tags: ${postType === "wechat" ? "[朋友圈]" : tags || "[]"}
category: ${postType === "wechat" ? "'生活'" : "''"}
draft: false
lang: zh_CN
---

${finalContent}
`;

		// 先上传图片
		if (selectedFiles.length > 0) {
			isUploadingImages = true;
			publishResult = `📤 正在上传 ${selectedFiles.length} 张图片...`;

			for (let i = 0; i < selectedFiles.length; i++) {
				const file = selectedFiles[i];
				try {
					const base64 = await fileToBase64(file);
					await uploadFileToGitHub(
						`${imagesPath}${file.name}`,
						base64,
						`Upload: ${file.name}`,
					);
					publishResult = `📤 上传进度: ${i + 1}/${selectedFiles.length}`;
				} catch (error) {
					console.error(`Failed to upload ${file.name}:`, error);
					alert(`图片 ${file.name} 上传失败: ${error}`);
				}
			}
		}

		// 再上传文章
		publishResult = "📝 正在保存文章...";
		const articleBase64 = btoa(unescape(encodeURIComponent(frontmatter)));

		await uploadFileToGitHub(filePath, articleBase64, `发布文章: ${title}`);

		publishResult = "✅ 发布成功！GitHub Actions 正在构建...";

		setTimeout(() => {
			title = "";
			content = "";
			tags = "";
			selectedFiles = [];
			imagePreviews = [];
			publishResult = "";
		}, 3000);
	} catch (error) {
		console.error("Publish error:", error);
		publishResult = `❌ 发布失败: ${error.message}`;
	} finally {
		isPublishing = false;
		isUploadingImages = false;
	}
}

function showTokenModal() {
	const token = prompt(
		"请输入 GitHub Personal Access Token:\n\n" +
			"1. 访问 https://github.com/settings/tokens\n" +
			"2. 生成新 Token，勾选 repo 权限\n" +
			"3. 粘贴 Token（会自动保存）",
	);
	if (token) {
		localStorage.setItem("github_token", token);
		githubToken = token;
	}
}

function openTokenSettings() {
	if (confirm("要重新设置 GitHub Token 吗？")) {
		showTokenModal();
	}
}
</script>

<div class="bg-white dark:bg-neutral-900 rounded-2xl shadow-lg p-6 space-y-6">
	<!-- 文章类型选择 -->
	<div>
		<label className="block text-sm font-medium mb-2">文章类型</label>
		<div class="flex gap-3">
			<button
				class="flex-1 py-3 px-4 rounded-xl font-medium transition {postType === 'wechat'
					? 'bg-[var(--primary)] text-white'
					: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
				}"
				on:click={() => (postType = "wechat")}
			>
				📱 朋友圈
			</button>
			<button
				class="flex-1 py-3 px-4 rounded-xl font-medium transition {postType === 'normal'
					? 'bg-[var(--primary)] text-white'
					: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
				}"
				on:click={() => (postType = "normal")}
			>
				📝 普通文章
			</button>
		</div>
	</div>

	<!-- 标题 -->
	<div>
		<label className="block text-sm font-medium mb-2">标题</label>
		<input
			type="text"
			bind:value={title}
			placeholder="输入文章标题..."
			class="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-[var(--primary)] outline-none transition"
		/>
	</div>

	<!-- 标签（仅普通文章显示） -->
	{#if postType === "normal"}
		<div>
			<label className="block text-sm font-medium mb-2">标签（可选，用逗号分隔）</label>
			<input
				type="text"
				bind:value={tags}
				placeholder="Android, 鸿蒙, Kotlin..."
				class="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-[var(--primary)] outline-none transition"
			/>
		</div>
	{/if}

	<!-- 图片上传 - 移动端优化 -->
	<div>
		<label className="block text-sm font-medium mb-2">图片（可选）</label>

		<!-- 移动端图片选择按钮 -->
		<div class="grid grid-cols-2 gap-3 mb-3">
			<!-- 相册按钮 -->
			<label class="flex items-center justify-center gap-2 py-4 px-4 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 cursor-pointer hover:border-[var(--primary)] hover:bg-neutral-50 dark:hover:bg-neutral-800 transition">
				<span class="text-2xl">🖼️</span>
				<span class="text-sm font-medium">相册</span>
				<input
					type="file"
					accept="image/*"
					multiple
					on:change={handleGallerySelect}
					class="hidden"
				/>
			</label>

			<!-- 拍照按钮 -->
			<label class="flex items-center justify-center gap-2 py-4 px-4 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 cursor-pointer hover:border-[var(--primary)] hover:bg-neutral-50 dark:hover:bg-neutral-800 transition">
				<span class="text-2xl">📷</span>
				<span class="text-sm font-medium">拍照</span>
				<input
					type="file"
					accept="image/*"
					capture="environment"
					on:change={handleCameraCapture}
					class="hidden"
				/>
			</label>
		</div>

		<!-- 已选数量提示 -->
		{#if selectedFiles.length > 0}
			<div class="flex items-center justify-between mb-3 px-2">
				<span class="text-xs text-neutral-500 dark:text-neutral-400">
					已选择 {selectedFiles.length} 张图片
				</span>
				<button
					on:click={() => {
						if (confirm("要清空所有图片吗？")) {
							selectedFiles = [];
							imagePreviews = [];
						}
					}}
					class="text-xs text-red-500 hover:text-red-600 transition"
				>
					清空全部
				</button>
			</div>
		{/if}

		<!-- 图片预览网格 -->
		{#if imagePreviews.length > 0}
			<div class="grid grid-cols-3 gap-2 mb-3">
				{#each imagePreviews as preview, index}
					<div class="relative aspect-square rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 touch-manipulation">
						<img
							src={preview}
							alt="预览"
							class="w-full h-full object-cover"
						/>
						<button
							on:click={() => removeImage(index)}
							class="absolute top-1 right-1 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-base hover:bg-red-600 transition touch-manipulation shadow-lg"
						>
							×
						</button>
						<div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2">
							<span class="text-white text-xs truncate">
								{selectedFiles[index]?.name}
							</span>
						</div>
					</div>
				{/each}
			</div>

			<!-- 上传提示 -->
			<div class="text-xs text-neutral-500 dark:text-neutral-400 px-2">
				💡 图片会先上传，然后保存文章
			</div>
		{/if}
	</div>

	<!-- 内容 -->
	<div>
		<label className="block text-sm font-medium mb-2">内容（支持 Markdown）</label>
		<textarea
			bind:value={content}
			rows="12"
			placeholder="开始写作..."
			class="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-[var(--primary)] outline-none transition resize-none font-mono text-sm"
		></textarea>
	</div>

	<!-- 发布结果 -->
	{#if publishResult}
		<div class="p-4 rounded-xl text-center {publishResult.includes('成功')
			? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
			: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
		}">
			{publishResult}
		</div>
	{/if}

	<!-- 操作按钮 -->
	<div class="flex gap-3">
		<button
			on:click={openTokenSettings}
			class="px-6 py-3 rounded-xl font-medium transition bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
		>
			⚙️ Token
		</button>
		<button
			on:click={publishPost}
			disabled={isPublishing}
			class="flex-1 px-6 py-3 rounded-xl font-medium transition bg-[var(--primary)] text-white hover:opacity-90 disabled:opacity-50"
		>
			{#if isUploadingImages}
				📤 上传中...
			{:else if isPublishing}
				🚀 发布中...
			{:else}
				🚀 发布
			{/if}
		</button>
	</div>
</div>

<style>
	label {
		@apply block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300;
	}

	.touch-manipulation {
		touch-action: manipulation;
	}

	button {
		touch-action: manipulation;
	}
</style>
