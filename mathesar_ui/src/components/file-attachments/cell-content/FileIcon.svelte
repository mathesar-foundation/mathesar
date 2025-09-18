<script lang="ts">
  import { Icon } from '@mathesar/component-library';
  import type { IconProps } from '@mathesar/component-library/types';
  import {
    iconFileAlt,
    iconFileArchive,
    iconFileAudio,
    iconFileCSV,
    iconFileCode,
    iconFileExcel,
    iconFileImage,
    iconFilePDF,
    iconFilePowerpoint,
    iconFileVideo,
    iconFileWord,
  } from '@mathesar/icons';

  export let mimetype: string;

  const exact: Record<string, IconProps> = {
    'application/pdf': iconFilePDF,
    'application/msword': iconFileWord,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      iconFileWord,
    'application/vnd.ms-excel': iconFileExcel,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      iconFileExcel,
    'application/vnd.ms-powerpoint': iconFilePowerpoint,
    'application/vnd.openxmlformats-officedocument.presentationml.presentation':
      iconFilePowerpoint,
    'application/zip': iconFileArchive,
    'application/x-7z-compressed': iconFileArchive,
    'application/x-rar-compressed': iconFileArchive,
    'application/x-tar': iconFileArchive,
    'application/json': iconFileCode,
    'text/csv': iconFileCSV,
    'text/x-csv': iconFileCSV,
  };

  const byCategory: Record<string, IconProps> = {
    image: iconFileImage,
    video: iconFileVideo,
    audio: iconFileAudio,
    text: iconFileCode,
  };

  function getIcon(iconMimetype: string) {
    if (exact[iconMimetype]) return exact[iconMimetype];

    const category = iconMimetype.split('/', 1).at(0);
    if (category) {
      return byCategory[category] ?? iconFileAlt;
    }

    return iconFileAlt;
  }

  $: fileIcon = getIcon(mimetype);
</script>

<Icon {...fileIcon} {...$$restProps} />
