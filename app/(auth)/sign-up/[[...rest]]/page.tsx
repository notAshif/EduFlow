import { SignUp } from "@clerk/nextjs";
import React from "react";

const Page = () => {
  return (
    <div>
      <SignUp redirectUrl="/dashboard" />
    </div>
  );
};

export default Page;
