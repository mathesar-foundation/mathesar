<script lang="ts">
    import {
      Button,
      Modal,
      Icon,
    } from '@mathesar-components';
    import {
      tables,
    } from '@mathesar/stores/tables';
    import { faTable } from '@fortawesome/free-solid-svg-icons';
    import {
    refetchTablesForSchema,
    deleteTable
  } from '@mathesar/stores/tables';

  
    export let isOpen = false; 
    let arr = [];
    export let placement = 'bottom-start';

   
   function casa(){
     $tables?.data?.forEach((value) => {
        arr.push(value.name);
      })
     
    }
    if(isOpen == true){
      casa();
    }
    $: arr2 = arr
    function close(){
        isOpen = false;
    }
    function confirmDelete(){

    }
  </script>
  <style>
     .dropdown.content {
        max-height: 150px;
        padding-left:0;
        overflow:auto;
    }
    li:hover {
        background-color:#e2e2e4;
    }
    li {
        padding: 10px;
    }
    ul{
        list-style-type: none;
    }
    span {
        margin-left: 6px;
    }
    .header {
        font-weight: bold;
        margin-bottom: 10px;
    }
    .footer {
      text-align: right;
   }
  </style>
  <Modal  bind:isOpen>
    <div>
      <div class="header">
        Deleting 'Release' could break existing tables and views.
      </div >
      <div class="help-text">
        All Objects related to this table will be afected. 
      </div>
      <ul class='dropdown content'>
        <li><Icon data={faTable}/> Hola Amigo</li>
        <li><Icon data={faTable}/> Hola Amigo</li>
        <li><Icon data={faTable}/> Hola Amigo</li>
        <li><Icon data={faTable}/> Hola Amigo</li>
        <li><Icon data={faTable}/> Hola Amigo</li>
        <li><Icon data={faTable}/> Hola Amigo</li>
        <li><Icon data={faTable}/> Hola Amigo</li>
        <li><Icon data={faTable}/> Hola Amigo</li>
     </ul>
    </div>
    
    <svelte:fragment slot="footer">
        <!-- <div class="footer"> -->
        <Button on:click={() => { isOpen = false; }}>Cancel</Button>
        <Button appearance="primary" on:click{confirmDelete} >
        Delete Table
        </Button>
        <!-- </div> -->
    </svelte:fragment>
  </Modal>