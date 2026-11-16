import { APP_NAME } from "../utils/constant";

function Footer() {
  return (
    <footer className="footer sm:footer-horizontal footer-center bg-base-300 fixed bottom-0 text-base-content p-4">
      <aside>
        <p>
          Copyright © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </p>
      </aside>
    </footer>
  );
}

export default Footer;
