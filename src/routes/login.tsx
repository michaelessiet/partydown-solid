import {
  cache,
  createAsync,
  redirect,
  useSubmission,
  type RouteSectionProps
} from "@solidjs/router";
import { Show } from "solid-js";
import { loginOrRegister } from "~/lib";
import { getSession } from "~/lib/server";

// This doesn't
const checkForSession = async () => {
  const session = await getSession()
  if (session.data.userId) {
    throw redirect('/')
  }
  return "asdf"
}

// This works
// const checkForSession = cache(async () => {
//   const session = await getSession();
//   if (session.data.userId) {
//     throw redirect("/");
//   }
//   return 'adsf'
// }, 'checkForSession')

export const route = {
  load: () => checkForSession()
}

export default function Login(props: RouteSectionProps) {
  const loggingIn = useSubmission(loginOrRegister);
  const user = createAsync(() => checkForSession(), { deferStream: false });

  return (
    <main>
      <h1>Login {user()}</h1>
      <form action={loginOrRegister} method="post">
        <input type="hidden" name="redirectTo" value={props.params.redirectTo ?? "/"} />
        <fieldset>
          <legend>Login or Register?</legend>
          <label>
            <input type="radio" name="loginType" value="login" checked={true} /> Login
          </label>
          <label>
            <input type="radio" name="loginType" value="register" /> Register
          </label>
        </fieldset>
        <div>
          <label for="username-input">Username</label>
          <input name="username" placeholder="kody" />
        </div>
        <div>
          <label for="password-input">Password</label>
          <input name="password" type="password" placeholder="twixrox" />
        </div>
        <button type="submit">Login</button>
        <Show when={loggingIn.result}>
          <p style={{ color: "red" }} role="alert" id="error-message">
            {loggingIn.result!.message}
          </p>
        </Show>
      </form>
    </main>
  );
}
