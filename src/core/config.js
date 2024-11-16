import en from '../locales/en';
import ig from '../locales/ig';
import ar from '../locales/ar';
import de from '../locales/de';
import es from '../locales/es';
import fr from '../locales/fr';
import hi from '../locales/hi';
import lt from '../locales/lt';
import pt from '../locales/pt';
import ru from '../locales/ru';

export default { 
    debug: true,

    locales: {
        en,                 // Primary Local should come first before other locales
        ig,
        ar,
        de,
        es,
        fr,
        hi,
        lt,
        pt,
        ru

    },     

    file_patterns: {
        image: [
            /^image\/(png|gif|jpe?g)/,
        ],
        video: [
            /^video\/(.+?)/,
        ],
        pdf: [
            /application\/json/
        ],
        document: [
            /application\/json/
        ],
    },

    attributes: {
        // email: "Email Address",
        // first_name: "First Name",
        // last_name: "Last Name",
        // phone: "Phone Number"
    },


    customRules: {
        // exist: {
        //     fn: async ({value}) => {
        //         try {
        //             const user = await fetch('/api/user_end_point', {
        //                 body: JSON.stringify({username: value})
        //             });
        //             return user;
        //         } catch(e) {}
        //     },
        //     message: 'User account already exists'
        // },

        // // add others
    }
}