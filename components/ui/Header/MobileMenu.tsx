"use client";

import React, { useState } from "react";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
    DrawerDescription,
} from "../drawer";
import { Button } from "../button";
import { Menu, LayoutDashboard, PenBox } from "lucide-react";
import Link from "next/link";
import { SignedIn, UserButton } from "@clerk/nextjs";

const MobileMenu = () => {
    const [open, setOpen] = useState(false);

    return (
        <div className="md:hidden">
            <Drawer direction="right" open={open} onOpenChange={setOpen}>
                <DrawerTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Menu className="h-6 w-6" />
                    </Button>
                </DrawerTrigger>

                <DrawerContent className="max-w-[300px]">
                    <DrawerHeader>
                        <DrawerTitle>Menu</DrawerTitle>
                        <DrawerDescription className="sr-only">Mobile Navigation</DrawerDescription>
                    </DrawerHeader>

                    <div className="flex flex-col gap-4 p-4">
                        <SignedIn>
                            <Link
                                href="/dashboard"
                                onClick={() => setOpen(false)}
                                className="flex items-center gap-2 text-lg font-medium text-gray-700 hover:text-blue-600"
                            >
                                <LayoutDashboard size={20} />
                                Dashboard
                            </Link>

                            <Link
                                href="/transaction/create"
                                onClick={() => setOpen(false)}
                                className="flex items-center gap-2 text-lg font-medium text-gray-700 hover:text-blue-600"
                            >
                                <PenBox size={20} />
                                Add Transaction
                            </Link>
                        </SignedIn>

                        {/* If we had public links they would go here */}
                    </div>
                </DrawerContent>
            </Drawer>
        </div>
    );
};

export default MobileMenu;
