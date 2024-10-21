import { Optional, Order, ResourceID, SongsQueryPayload, Tag } from "../../../../../@types";
import { SearchQueryError } from "../../../../../main/lib/search-parser/@search-types";
import { namespace } from "../../../App";
import Impulse from "../../../lib/Impulse";
import { none, some } from "../../../lib/rust-like-utils-client/Optional";
import InfiniteScroller from "../../InfiniteScroller";
import PlayNext from "../context-menu/items/PlayNext";
import SongItem from "../song-item/SongItem";
import SongListSearch from "../song-list-search/SongListSearch";
import { songsSearch } from "./song-list.utils";
import Tabs from "@renderer/components/tabs/Tabs";
import { SIDEBAR_PAGES } from "@renderer/scenes/main-scene/main.utils";
import { Component, createEffect, createSignal, onCleanup, onMount } from "solid-js";

export type SongViewProps = {
  isAllSongs?: boolean;
  isQueue?: boolean;
  playlist?: string;
};

const SongList: Component<SongViewProps> = (props) => {
  const tagsSignal = createSignal<Tag[]>([], { equals: false });
  const [tags] = tagsSignal;

  const [order, setOrder] = createSignal<Order>({ option: "title", direction: "asc" });
  const [count, setCount] = createSignal(0);

  const [payload, setPayload] = createSignal<SongsQueryPayload>({
    view: props,
    order: order(),
    tags: tags(),
  });

  const [searchError, setSearchError] = createSignal<Optional<SearchQueryError>>(none(), {
    equals: false,
  });
  const resetListing = new Impulse();

  const searchSongs = async () => {
    const o = order();
    const t = tags();
    const parsedQuery = await window.api.request("parse::search", songsSearch());

    if (parsedQuery.type === "error") {
      setSearchError(some(parsedQuery));
      return;
    }

    setSearchError(none());
    setPayload({
      view: props,
      searchQuery: parsedQuery,
      order: o,
      tags: t,
    });
    resetListing.pulse();
  };

  onMount(() => {
    createEffect(searchSongs);
    window.api.listen("songView::reset", resetListing.pulse.bind(resetListing));
  });

  onCleanup(() => {
    window.api.removeListener("songView::reset", resetListing.pulse.bind(resetListing));
  });

  const createQueue = async (songResource: ResourceID) => {
    await window.api.request("queue::create", {
      startSong: songResource,
      ...payload(),
    });
  };

  const group = namespace.create(true);

  return (
    <Tabs.Content value={SIDEBAR_PAGES.SONGS.value}>
      <div class="absolute right-0 top-0 flex h-full w-[480px] min-w-[320px] flex-col">
        <div class="z-10">
          <SongListSearch tags={tagsSignal} setOrder={setOrder} count={count} error={searchError} />
        </div>

        <div class="flex-grow overflow-y-auto p-5 py-0">
          <InfiniteScroller
            apiKey={"query::songsPool"}
            apiData={payload()}
            apiInitKey={"query::songsPool::init"}
            apiInitData={payload()}
            setCount={setCount}
            reset={resetListing}
            fallback={<div class="py-8 text-center text-lg uppercase text-subtext">No songs</div>}
            builder={(s) => (
              <SongItem song={s} group={group} onSelect={createQueue}>
                <PlayNext path={s.path} />
                <button class="w-full px-4 py-2 text-left transition-colors duration-200 hover:bg-accent/20">
                  Add to playlist
                </button>
              </SongItem>
            )}
          />
        </div>
      </div>
    </Tabs.Content>
  );
};

export default SongList;
