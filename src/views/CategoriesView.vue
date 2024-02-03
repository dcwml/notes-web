<template>
	<div class="p-category" :class="{ ready: ready }"></div>
</template>

<script>
	export default {
		components: {},
		setup () {},
		data () {
			return {
				ready: false,
				loading: false,
			}
		},
		computed: {},
		mounted () {
			this.ready = true
		},
		methods: {},
	}
</script>

<style lang="less">
	.p-category {
		display: none;

		&.ready {
			display: block;
		}
	}
</style>
