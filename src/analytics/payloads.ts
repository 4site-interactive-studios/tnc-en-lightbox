export type TealiumEvent = 'impression' | 'click'

export type TealiumPayload = {
  event_name: 'lightbox_impression' | 'lightbox_click'
  lightbox_name: 'inactivity-exit'
}

const LIGHTBOX_NAME: TealiumPayload['lightbox_name'] = 'inactivity-exit'
const EVENT_NAMES: Record<TealiumEvent, TealiumPayload['event_name']> = {
  impression: 'lightbox_impression',
  click: 'lightbox_click',
}

export function buildTealiumPayload(event: TealiumEvent): TealiumPayload {
  return {
    event_name: EVENT_NAMES[event],
    lightbox_name: LIGHTBOX_NAME,
  }
}
