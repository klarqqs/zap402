import React from "react";

import AskTerminalPanel from "@/sections/dashboard/AskTerminalPanel";

/** Inbox route — same experience as Ask (preview + coming soon), different page title. */
const CloneTab: React.FC = () => <AskTerminalPanel variant="inbox" />;

export default CloneTab;
