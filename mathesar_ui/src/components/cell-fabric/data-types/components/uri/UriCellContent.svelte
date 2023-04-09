<script lang="ts">
  import { scale } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { iconNextStep } from '@mathesar/icons';
  import Icon from '@mathesar-component-library-dir/icon/Icon.svelte';
  export let isActive = false;
  export let value: string | null | undefined;
  let hovering = false
	
	const enter = () => {
		hovering = true
		
	}
	
	const leave = () => (hovering = false)
</script>


{#if isActive}

<div class="relative" on:mouseenter={enter} on:mouseleave={leave}>
	{value}
  {#if hovering}

  
  <div in:scale={{duration: 150, easing: quintOut, opacity: 20}}
       class="hover_card">
       
    <div class="hover_card_details">
      <a href={value ?? ''} target="_blank" class="link"> 
      visit
        <Icon {...iconNextStep} ></Icon>
      </a>
    </div>
  
    
  </div>


{/if}
</div>
  <!-- <a href={value ?? ''} target="_blank" class="link">
    <slot />
  </a> -->
{:else}
  <span class="content">
    <slot />
    
  </span>
{/if}

<style>
  .content {
    text-decoration: underline;
  }
  .link {
    color: var(--sky-700);
  }
  .link:visited {
    color: var(--purple-500);
  }
  .hover_card{
		position: absolute; 
top: 0rem; 
right: 0rem; 
z-index: 50; 
background-color: #F3F4F6; 
width: 4rem; 
border-radius: 0.1rem; 
border-width: 1px; 
	
	}
	.hover_card_details{
    text-align: right; 
		font-size: 1rem;
font-weight: 600; 

	}
</style>
