/*
 * RAMFAM ARCHIVE — VIDEO DATABASE
 * ================================
 * This is the only file you need to edit to add new footage.
 *
 * Add one object to VIDEOS per digitized tape/video you upload to YouTube.
 * Each video has a list of "clips" — moments inside it people can jump to.
 * Tag each clip with everyone who appears in it, and they'll show up
 * under that person's tab on the site automatically.
 *
 * HOW TO ADD A NEW VIDEO:
 *   1. Upload the digitized video to YouTube, grab its video ID.
 *      (the part after "watch?v=" in the URL, e.g. "dQw4w9WgXcQ")
 *   2. Copy one of the objects below, paste it above the closing "];",
 *      and fill in year / title / youtubeId.
 *   3. Watch through the video and add a "clip" entry for each moment
 *      worth jumping to. "time" is in SECONDS from the start.
 *   4. List every family member visible in that clip under "people" —
 *      use the exact same spelling each time (e.g. always "Luke", not
 *      "luke" or "Lukey") so clips group correctly on their tab.
 *
 * That's it — the site reads this file and builds everything else.
 */

const VIDEOS = [
  {
    id: "1988-tape3",                 // unique, no spaces — used internally
    year: 1988,
    title: "Summer 1988 — VHS Tape 3",
    youtubeId: "jNQXAC9IVRw",         // PLACEHOLDER — replace with your real video ID
    clips: [
      { time: 0,   label: "Opening titles",          people: ["Luke", "Mom", "Dad"] },
      { time: 42,  label: "Backyard birthday party",  people: ["Luke", "Sarah"] },
      { time: 130, label: "Grandma visits",           people: ["Grandma", "Mom"] },
      { time: 210, label: "Trip to the lake",         people: ["Luke", "Dad", "Sarah"] }
    ]
  },
  {
    id: "1992-tape7",
    year: 1992,
    title: "1992 — Christmas & New Year",
    youtubeId: "jNQXAC9IVRw",         // PLACEHOLDER — replace with your real video ID
    clips: [
      { time: 0,   label: "Opening presents",  people: ["Luke", "Sarah", "Mom", "Dad"] },
      { time: 95,  label: "Grandma's cookies",  people: ["Grandma", "Sarah"] },
      { time: 260, label: "New Year's countdown", people: ["Luke", "Dad"] }
    ]
  }
];
