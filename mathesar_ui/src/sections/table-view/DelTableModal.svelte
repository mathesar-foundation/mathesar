<script lang="ts">
    import {
      Button,
      TextInput,
      portal,
      popper,
      clickOffBounds,
      Modal,
      Icon,
      Dropdown,
    } from '@mathesar-components';
    import {
      tables,
    } from '@mathesar/stores/tables';

  
    export let isOpen = false; 
    let arr = [];
    export let placement = 'bottom-start';
    let contentClass="table-opts-content"
   
   function casa(){
     $tables?.data?.forEach((value) => {
        arr.push(value.name);
      })
     
    }
    if(isOpen == true){
      casa();
      console.log(arr);
    }
    $: arr2 = arr
    function close(){
        isOpen = false;
    }
  </script>
  <style>
     .dropdown.content {
	 box-shadow: #000 0 0 0 0, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px;
	 border-radius: 2px;
	 background: #fff;
	 z-index: 100;
	 max-height: 100px;
	 overflow: auto;
     
}
 .dropdown.content[data-popper-placement="top-start"] {
	 box-shadow: rgba(0, 0, 0, 0.1) 0px -10px 15px -3px, rgba(0, 0, 0, 0.05) 0px -4px 2px -2px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, #000 0 0 0 0;
}
 
  </style>
  <Modal bind:isOpen>
    <div>
      <div class="header">
        Deleting 'Release' could break existing tables and views.
      </div >
      <div class="help-text">
        All Objects related to this table will be afected. 
      </div>
      <!-- <Dropdown>
        <svelte:fragment slot="content">
          <ul>
            {#each arr2 as table}
              <li class="item">
                  {table}
              </li>
            {/each}
          </ul>
        </svelte:fragment>
      </Dropdown> -->
      <div class='dropdown content'
        use:popper={{ options: { placement } }}
        >
        <div>Hola Amigo</div>
        <div>Hola Amigo1</div>
        <div>Hola Amigo</div> 
        <div>Hola Amigo</div> 
        <div>Hola Amigo</div> 
        <div>Hola Amigo</div>
        <div>Hola Amigo1</div>
        <div>Hola Amigo</div> 
        <div>Hola Amigo</div> 
        <div>Hola Amigo</div> 
        

        </div>
    </div>
  </Modal>