import SongContextMenuItem from "@renderer/components/song/context-menu/SongContextMenuItem";
import { DeleteIcon } from "lucide-solid";
import { Component } from "solid-js";
import { Song } from "src/@types";
import { deleteSong } from "../playlist.utils";

type RemoveFromPlaylistProps = {
  playlistName: string;
  song: Song;
};

const RemoveFromPlaylist: Component<RemoveFromPlaylistProps> = (props) => {
  return (
    <SongContextMenuItem
      onClick={async () => {
        await deleteSong(props.playlistName, props.song);
      }}
      class="hover:bg-red/20"
    >
      <p class="text-red">Remove song</p>
      <DeleteIcon class="text-red" size={20} />
    </SongContextMenuItem>
  );
};

export default RemoveFromPlaylist;