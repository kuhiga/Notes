// This will be the object that will contain the Vue attributes
// and be used to initialize it.
let app = {};

// Given an empty app object, initializes it filling its attributes,
// creates a Vue instance, and then initializes the Vue instance.
let init = (app) => {

    // This is the Vue data.
    app.data = {
        posts: [], // See initialization.
    };

    app.index = (a) => {
        // Adds to the posts all the fields on which the UI relies.
        let i = 0;
        for (let p of a) {
            p._idx = i++;
            // TODO: Only make the user's own posts editable.
            if(user_email==p.email){
                p.editable = true;

            }else{
                p.editable = false;

            }
            p.edit = false;
            p.is_pending = false;
            p.error = false;
            p.original_content = p.content; // Content before an edit.
            p.server_content = p.content; // Content on the server.
        }
        return a;
    };

    app.reindex = () => {
        // Adds to the posts all the fields on which the UI relies.
        let i = 0;
        for (let p of app.vue.posts) {
            p._idx = i++;
        }
    };

    app.do_edit = (post_idx) => {
        // Handler for button that starts the edit.
        // TODO: make sure that no OTHER post is being edited.
        // If so, do nothing.  Otherwise, proceed as below.
        let p = app.vue.posts[post_idx];
        p.edit = true;
        p.is_pending = false;
    };

    app.do_cancel = (post_idx) => {
        // Handler for button that cancels the edit.
        let p = app.vue.posts[post_idx];
        if (p.id === null) {
            // If the post has not been saved yet, we delete it.
            app.vue.posts.splice(post_idx, 1);
            app.reindex();
        } else {
            // We go back to before the edit.
            p.edit = false;
            p.is_pending = false;
            p.content = p.original_content;
        }
    }

    app.do_save = (post_idx) => {
        // Handler for "Save edit" button.
        let p = app.vue.posts[post_idx];
        if(p.content == ""){
            app.do_cancel(post_idx)
        }else{
            if (p.content !== p.server_content) {
                p.is_pending = true;
                axios.post(posts_url, {
                    content: p.content,
                    is_reply: p.is_reply,
                    id: p.id,
                    email: p.email,
                    author: p.author
                }).then((result) => {
                    console.log("Received:", result.data);
                    // TODO: You are receiving the post id (in case it was inserted),
                    // and the content.  You need to set both, and to say that
                    // the editing has terminated.
                    console.log(p.id)
                    p.author = result.data.author;
                    p.id = result.data.id;
                    console.log(p.id)
                    p.content = result.data.content; 
                    // p.is_reply = result.data.is_reply;
                    p.edit = false;
                }).catch(() => {
                    p.is_pending = false;
                    console.log("Caught error");
                    edit = true;
                });
            } else {
                // No need to save.
                p.edit = false;
                p.original_content = p.content;
            }
        }
    }

    app.add_post = () => {
        // TODO: this is the new post we are inserting.
        // You need to initialize it properly, completing below, and ...
        let q = {
            id: null,
            edit: true,
            editable: true,
            content: "",
            server_content: null,
            original_content: "",
            author: null,
            email: null,
            is_reply: null,
        };
        // TODO:
        // ... you need to insert it at the top of the post list.
        app.vue.posts.unshift(q)
        app.reindex();
    };

    app.reply = (post_idx) => {
        let p = app.vue.posts[post_idx];
        console.log("reply pressed" + p.id);

        if (p.id !== null) {
            // TODO: this is the new reply.  You need to initialize it properly...
            let q = {
                id: null,
                edit: true,
                editable: true,
                content: "",
                server_content: null,
                original_content: "",
                author: null,
                email: null,
                is_reply: p.id,
            };
            console.log(q.is_reply + "Ahahaha")
            // TODO: and you need to insert it in the right place, and reindex
            // the posts.  Look at the code for app.add_post; it is similar.
            // app.vue.posts.unshift(q)
            app.vue.posts.splice(post_idx+1, 0, q);
            app.reindex();


        }
    };

    app.do_delete = (post_idx) => {
        let p = app.vue.posts[post_idx];
        if (p.id === null) {
            // TODO:
            // If the post has never been added to the server,
            // simply deletes it from the list of posts.
            app.vue.posts.splice(post_idx,1);
            app.reindex();

        } else {
            // TODO: Deletes it on the server.
            axios.post(delete_url, {id: p.id}).then(() => {
                app.vue.posts.splice(post_idx, 1);
                app.reindex();
            });
        }
    };

    // We form the dictionary of all methods, so we can assign them
    // to the Vue app in a single blow.
    app.methods = {
        do_edit: app.do_edit,
        do_cancel: app.do_cancel,
        do_save: app.do_save,
        add_post: app.add_post,
        reply: app.reply,
        do_delete: app.do_delete,
    };

    // This creates the Vue instance.
    app.vue = new Vue({
        el: "#vue-target",
        data: app.data,
        methods: app.methods
    });

    // And this initializes it.
    app.init = () => {
        // You should load the posts from the server.
        // This is purely debugging code.
        posts = [
            // This is a post.
            {
                id: 1,
                content: "I love apples",
                author: "Joe Smith",
                email: "joe@ucsc.edu",
                is_reply: null, // Main post.  Followed by its replies if any.
            },
            {
                id: 2,
                content: "I prefer bananas",
                author: "Elena Degiorgi",
                email: "elena@ucsc.edu",
                is_reply: 1, // This is a reply.
            },
            {
                id: 3,
                content: "I prefer bananas",
                author: "Elena Degiorgi",
                email: "elena@ucsc.edu",
                is_reply: 1, // This is a reply.
            },
        ];
        // TODO: Load the posts from the server instead.
        // We set the posts.
        axios.get(posts_url)
            .then((result) => {
                // We set them
                let posts = result.data.posts;
                app.index(posts);
                app.vue.posts = posts;


            });

        app.vue.posts = app.reindex(posts);
    };

    // Call to the initializer.
    app.init();
};

// This takes the (empty) app object, and initializes it,
// putting all the code i
init(app);
